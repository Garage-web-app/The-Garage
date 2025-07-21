import argparse
import shlex
import subprocess
import os
import dotenv
import re
import time
import psutil

# Gather up the processes tuples. Each tuple is (process, stdout file, stderr file) we will use this later to terminate the processes
processes_handles = []

def clear_databases(services: list, services_to_exclude: list, services_root: str):
    """
    Clear the databases for each service except the ones in the exclude list.
    
    Parameters
    ----------
    services : list
        List of service names
    services_to_exclude : list
        List of service names that should be excluded
    services_root : str
        Root directory of the services
    """
    # Clear the databases for each service except the ones in the exclude list
    for service in services:
        if service not in services_to_exclude:

            # This command runs the JavaScript script to clear the database
            cmd = "npm run dropdb"
            
            try:
                subprocess.run(
                    cmd,
                    cwd=f"{os.path.join(services_root, service)}",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True,
                    shell=True
                )

                print(f"Successfully cleared database for {service}")
            except subprocess.CalledProcessError as e:
                print(f"Failed to clear database for {service}")
                print(f"stdout:\n{e.stdout.decode()}")
                print(f"stderr:\n{e.stderr.decode()}")
                raise e
            except Exception as e:
                print(f"Unexpected error while clearing database for {service}:\n{e}")
                raise e


def kill_process_tree(pid, grace_period=3):
    """
    Kill a process tree including all child processes
    
    Parameters
    ----------
    proc : Popen
        The parent process
    grace_period : int
        The time in seconds to wait for processes to terminate gracefully
        before killing them with SIGKILL
    
    Raises
    ------
    Exception
        If there is an error killing the process tree
    """
    try:
        parent = psutil.Process(pid)
        children = parent.children(recursive=True)

        # Try graceful termination first
        for child in children:
            child.terminate()
        parent.terminate()

        # Wait for termination
        gone, alive = psutil.wait_procs([parent] + children, timeout=grace_period)
        
        # Force kill remaining
        for p in alive:
            p.kill()
    except Exception as e:
        print(f"Failed to kill process tree for PID {pid}: {e}")
        raise e

def cleanup_processes(processes: list):
    """
    Clean up processes and MongoDB instances spawned by this script.
    
    Parameters
    ----------
    processes : list
        List of tuples containing a Popen object, an output log file, and an error log file
    mongo_paths : list
        List of paths to MongoDB data directories
    
    Raises
    ------
    Exception
        If there is an error killing the processes or MongoDB instances
    """
    print("\nCleaning up processes...")

    # Terminate the processes
    for process, out_file, err_file, name in processes:
        try:
            print(f"Terminating {name} process with PID {process.pid}...")
            if process.poll() is None:
                kill_process_tree(process.pid)
                print(f"Successfully terminated {name} process with PID {process.pid}")
            else:
                print(f"Process for {name} with PID {process.pid} is already terminated")
        except Exception as e:
            print(f"Failed to terminate {name} process with PID {process.pid}:\n{e}")
        finally:
            out_file.close()
            err_file.close()

    print("Cleanup complete.")

def wait_for_green_flag(component_name: str, logs_dir: str, timeOut: int, green_flag: str):
    """
    Wait for a green flag in a log file.

    Parameters
    ----------
    component_name : str
        The name of the component to wait for
    logs_dir : str
        The directory where the log files are located
    timeOut : int
        The number of seconds to wait for the green flag
    green_flag : str
        The string to look for in the log file

    Raises
    ------
    TimeoutError
        If the green flag is not found in the log file after timeOut seconds
    """
    # Log file to check for the green flag
    log_file = f"{os.path.join(logs_dir, f'{component_name}.out')}"
    start_time = time.time()

    # Wait for the green flag for timeOut seconds
    while time.time() - start_time < timeOut:
        # Check if the log file exists
        # if it does not exist, sleep for 1 second, maybe it is not created yet
        if not os.path.exists(log_file):
            time.sleep(1)
            continue

        # Check if the green flag is in the log file
        # if it is in the log file, return
        with open(log_file, "r") as f:
            if green_flag in f.read():
                return
            
        # If the green flag is not in the log file, sleep for 1 second
        time.sleep(1)
    
    # If the green flag is not in the log file after timeOut seconds, raise an error
    raise TimeoutError(f"[{component_name}] Did not give green flag '{green_flag}' in {timeOut} seconds.")


def spawn_services(services: list, services_to_exclude: list, env_file_name: str, services_root: str, logs_dir: str):
    """
    Spawn the services in the services list, excluding those in the services_to_exclude list
    
    Parameters
    ----------
    services : list
        List of service names to spawn
    services_to_exclude : list
        List of service names to exclude from spawning
    env_file_name : str
        Name of the .env file to load for each service
    services_root : str
        Root directory of the services
    logs_dir : str
        Directory to save the log files to
    
    Returns
    -------
    list
        List of tuples containing a Popen object, an output log file, and an error log file for each spawned service
    """
    processes = []
    # Spawn the services
    for service in services:
        # Log files to save the output and errors to
        out_log_file = f"{os.path.join(logs_dir, f'{service}.out')}"
        err_log_file = f"{os.path.join(logs_dir, f'{service}.err')}"

        # If the service is in the exclude list, skip it
        if service in services_to_exclude:
            continue

        # Load the .env file for the service
        env_file_path = f"{os.path.join(services_root, service, env_file_name)}"
        env_copy = os.environ.copy()
        env_copy.update(dotenv.dotenv_values(env_file_path))

        print(f"Spawning {service}")
        
        # Directory to run the npm command in
        cwd = f"{os.path.join(services_root, service)}"
        
        # Command to run
        command = "npm i && npm run dev"
        
        # The service i slong running. It will be in the background
        try:
            # Save the output and errors to the log files
            out_file = open(out_log_file, "w")
            err_file = open(err_log_file, "w")

            process = subprocess.Popen(command, cwd=cwd, env=env_copy, stdout=out_file, stderr=err_file, shell=True)
            print(f"{service} spawned. Check the log files for errors.")

            processes.append((process, out_file, err_file, service))
        except Exception as e:
            out_file.close()
            err_file.close()

            print(f"Failed to spawn {service}")
            raise e

    return processes

def spawn_broker(broker_path: str, logs_dir: str, env_file_name: str):
    """
    Spawn the MQTT broker.

    Parameters
    ----------
    broker_path : str
        Path to the broker directory
    logs_dir : str
        Directory to save the log files to
    env_file_name : str
        Name of the .env file to load
    
    Returns
    -------
    tuple
        Tuple containing a Popen object, an output log file, and an error log file for the spawned broker
    """
    # Log files to save the output and errors to
    out_log_file = f"{os.path.join(logs_dir, 'broker.out')}"
    err_log_file = f"{os.path.join(logs_dir, 'broker.err')}"

    # Load the .env file for the broker
    env_file_path = f"{os.path.join(broker_path, env_file_name)}"
    env_copy = os.environ.copy()
    env_copy.update(dotenv.dotenv_values(env_file_path))

    # Directory to run the npm command in
    cwd = f"{broker_path}"
    # Command to run
    command = "npm i && npm run dev"

    print("Spawning broker")

    # The broker is long running. It will be in the background
    try:
        # Save the output and errors to the log files
        out_file = open(out_log_file, "w")
        err_file = open(err_log_file, "w")
        process = subprocess.Popen(command, cwd=cwd, env=env_copy, stdout=out_file, stderr=err_file, shell=True)
        print("Broker spawned. Check the log files for errors.")

        return (process, out_file, err_file, "broker")
    except Exception as e:
        out_file.close()
        err_file.close()

        print("Failed to spawn broker")
        raise e
    
def spawn_gateway(gateway_path: str, logs_dir: str, env_file_name: str, is_testing: bool):
    """
    Spawn the gateway.

    Parameters
    ----------
    gateway_path : str
        Path to the gateway directory
    logs_dir : str
        Directory to save the log files to
    env_file_name : str
        Name of the .env file to load
    is_testing : bool
        If true, run the test command instead of the dev command

    Returns
    -------
    tuple
        Tuple containing a Popen object, an output log file, and an error log file for the spawned gateway
    """
    # Log files to save the output and errors to
    out_log_file = f"{os.path.join(logs_dir, 'gateway.out')}"
    err_log_file = f"{os.path.join(logs_dir, 'gateway.err')}"

    # Load the .env file for the gateway
    env_file_path = f"{os.path.join(gateway_path, env_file_name)}"
    env_copy = os.environ.copy()
    env_copy.update(dotenv.dotenv_values(env_file_path))

    print("Spawning gateway")

    # Directory to run the npm command in
    cwd = f"{gateway_path}"
    # Command to run. If is_testing is true, run the test command
    if is_testing:
        command = "npm i && npm run test"
    else:
        command = "npm i && npm run dev"

    # The gateway is long running. It will be in the background
    try:
        # Save the output and errors to the log files
        out_file = open(out_log_file, "w")
        err_file = open(err_log_file, "w")

        process = subprocess.Popen(command, cwd=cwd, env=env_copy, stdout=out_file, stderr=err_file, shell=True)
        print("Gateway spawned. Check the log files for errors.")

        return (process, out_file, err_file, "gateway")
    except Exception as e:
        out_file.close()
        err_file.close()

        print("Failed to spawn gateway")
        raise e

def create_mongo_instances(services: list, services_to_exclude: list, env_file_name: str, services_root: str, logs_dir: str):
    """
    Create a mongo instance for each service in the services list except the ones in the exclude list.

    Parameters
    ----------
    services : list
        List of service names
    services_to_exclude : list
        List of service names to exclude
    env_file_name : str
        Name of the .env file to load
    services_root : str
        Root directory of the services
    logs_dir : str
        Directory to save the log files to

    Returns
    -------
    list
        List of paths to the mongo instances
    """ 
    # The base dir is where the mongo data will be stored
    # Please note that this is not the dir that mongo itself uses by default
    # as mongo uses ~/data/db
    mongo_base_path = f"{os.path.join(os.path.expanduser('~'), 'mongo_data')}"

    mongo_processes = []

    # Create the base dir
    try:
        os.makedirs(mongo_base_path, exist_ok=True)
    except Exception as e:
        print("Failed to create mongo base dir")
        raise e

    # Create the mongo instance for each service except the ones in the exclude list
    for service in services:
        if service not in services_to_exclude:
            # Load the .env file for the service
            env_file_path = f"{os.path.join(services_root, service, env_file_name)}"
            env_copy = os.environ.copy()
            env_copy.update(dotenv.dotenv_values(env_file_path))

            # Get the MONGO_URI from the .env file
            mongo_uri = env_copy.get("DATABASE_URI")

            if mongo_uri is None:
                raise ValueError("DATABASE_URI is not defined in the .env file")

            # Get the port from the MONGO_URI
            match = re.search(r"mongodb://.*:(\d+)", mongo_uri)
            if not match:
                raise ValueError(f"Invalid DATABASE_URI format in {service}")
            port = match.group(1)

            # Get the database name from the MONGO_URI
            sliced_mongo_uri = mongo_uri.split("/")

            # The last element in the sliced list is the database name e.g. mongodb://localhost:27017/test -> test is the database name
            database_name = sliced_mongo_uri[-1]
            
            # Create the path for the mongo instance for the service
            mongo_path = f"{os.path.join(mongo_base_path, database_name)}"

            # Create the path for the mongo log for the service
            mongo_log_path = f"{os.path.join(mongo_base_path, f"{database_name}.log")}"

            # Log files to save the output and errors to
            out_log_file = f"{os.path.join(logs_dir, f"{database_name}_database.out")}"
            err_log_file = f"{os.path.join(logs_dir, f"{database_name}_database.err")}"
            
            # Create the mongo dir for the service
            try:
                os.makedirs(mongo_path, exist_ok=True)
                print(f"Created mongo dir {mongo_path} for {service}")
            except Exception as e:
                print(f"Failed to create mongo dir {mongo_path} for {service}")
                raise e

            # Mongo instance creation command
            mongo_creation_cmd = f"mongod --port {port} --dbpath {mongo_path} --logpath {mongo_log_path} --logappend"
            
            # Use subprocess to run the command
            try:
                # Save the output and errors to the log files
                out_file = open(out_log_file, "w")
                err_file = open(err_log_file, "w")

                # Spawn the databases and save the process, stdout and stderr as tuple. This will be used later to terminate the processes
                process = subprocess.Popen(mongo_creation_cmd, stdout=out_file, stderr=err_file, shell=True)
                # Add the process, stdout and stderr to the list
                mongo_processes.append((process, out_file, err_file, f"{database_name}_database"))
            # If the log files could not be created
            except FileNotFoundError as e:
                print("Failed to create log files")
                raise e
            # If the mongo instance could not be created
            except Exception as e:
                # Close the log files
                out_file.close()
                err_file.close()
                # Clean up the processes that were created
                cleanup_processes(mongo_processes)
                print(f"Failed to create mongo instance for {service}")
                raise e
            
            print(f"Mongo instance created for {service} on port {port}. check {out_log_file}", 
                  "for logs.\n")
            
    # Return the list of mongo instaces processes which will be used to terminate the processes later on
    return mongo_processes

def main():
    """
    This script is used to start the services and the gateway for the chat app.
    It can be run with the --test argument to run the Postman tests.
    If the --test argument is passed, the script will clear the databases, spawn the broker, sthe ervices and then the gateway,
    which will then run the Postman tests.
    If the tests fail, the script will exit with a non-zero exit code.
    If the tests pass, the script will exit with a zero exit code.
    If the --test argument is not passed, the script will spawn the, broker, the services and the gateway without clearing the databases.
    The script will wait for the broker, the services, and the gateway to give the green flag.
    """
    # These are the green flags that will be printed when the services are running
    # These are used for the script to allow dependent services to start
    BROKER_GREEN_FLAG = f"Broker running on port"
    SERVICE_GREEN_FLAG = f"Subscribed to MQTT topics"
    GATEWAY_GREEN_FLAG = f"Gateway running on port"
    WAITING_TIMEOUT = 60

    # Create the argument parser for parsing the arguments passed to the script
    parser = argparse.ArgumentParser()
    # Add the arguments
    parser.add_argument("--test", "-t", action="store_true", help="Run Postman tests")

    # Get the root dir of the services
    services_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "services")
    services = [
        "user_service",
        "ad_service",
        "chat_service",
        "notification_service",
        "admin_service",
    ]

    gateway_path = f"{os.path.join(os.path.dirname(os.path.realpath(__file__)), 'api_gateway')}"
    broker_path = f"{os.path.join(os.path.dirname(os.path.realpath(__file__)), 'broker')}"
    env_file_name = ".env"
    # Get the logs dir
    logs_dir = f"{os.path.join(os.path.dirname(os.path.realpath(__file__)), 'logs')}"

    # Create the logs dir
    try:
        os.makedirs(logs_dir, exist_ok=True)
    except Exception as e:
        print("Failed to create logs dir")
        raise e

    # Parse the arguments
    args = parser.parse_args()

    # If the test argument is passed, set the env file name to .env.test
    if args.test:
        env_file_name = ".env.test"

    try:      
        mongo_processes = create_mongo_instances(services, ["notification_service"], env_file_name, services_root, logs_dir)
        processes_handles.extend(mongo_processes)
    except Exception as e:
        print(f"Failed to create mongo instances:\n{e}")
        exit(1)

    # If the test argument is passed we run gateway in test mode, otherwise we run it in dev mode
    if args.test:
        try:
            # Clear the databases
            clear_databases(services, ["notification_service"], services_root)

            # Spawn the broker
            broker_process_tuple = spawn_broker(broker_path, logs_dir, env_file_name)
            processes_handles.append(broker_process_tuple)
            # Wait for the broker to give the green flag
            wait_for_green_flag("broker", logs_dir, WAITING_TIMEOUT, BROKER_GREEN_FLAG)

            # After broker gave the green flag, spawn the services
            services_processes_tuples = spawn_services(services, [], env_file_name, services_root, logs_dir)
            processes_handles.extend(services_processes_tuples)
            # Wait for the services to give the green flag
            for service in services:
                wait_for_green_flag(service, logs_dir, WAITING_TIMEOUT, SERVICE_GREEN_FLAG)

            # Spawn the gateway after the services gave the green flag
            gateway_process_tuple = spawn_gateway(gateway_path, logs_dir, env_file_name, True)
            processes_handles.append(gateway_process_tuple)
            # Wait for the gateway to give the green flag
            wait_for_green_flag("gateway", logs_dir, WAITING_TIMEOUT, GATEWAY_GREEN_FLAG)
            # See if the tests passed

            gateway_exit_code = gateway_process_tuple[0].wait()
            # If the tests failed, exit with a non-zero exit code
            if gateway_exit_code != 0:
                print(f"Tests failed with exit code {gateway_exit_code}. Look at the logs for more information.")
                # Always terminate the processes before exiting
                cleanup_processes(processes_handles)
                exit(1)

            # If the tests passed, exit with a zero exit code
            print("\nAll tests passed.")
            # Always terminate the processes before exiting
            cleanup_processes(processes_handles)
            exit(0)
        except Exception as e:
            cleanup_processes(processes_handles)
            print("Failed to spawn services or gateway or broker or to clear databases.")
            print(e)
            exit(1)
    else:
        try:
            # Spawn the broker
            broker_process_tuple = spawn_broker(broker_path, logs_dir, env_file_name)
            processes_handles.append(broker_process_tuple)
            # Wait for the broker to give the green flag
            wait_for_green_flag("broker", logs_dir, WAITING_TIMEOUT, BROKER_GREEN_FLAG)

            # After broker gave the green flag, spawn the services
            services_processes_tuples = spawn_services(services, [], env_file_name, services_root, logs_dir)
            processes_handles.extend(services_processes_tuples)
            # Wait for the services to give the green flag
            for service in services:
                wait_for_green_flag(service, logs_dir, WAITING_TIMEOUT, SERVICE_GREEN_FLAG)

            # Spawn the gateway after the services gave the green flag
            gateway_process_tuple = spawn_gateway(gateway_path, logs_dir, env_file_name, False)
            processes_handles.append(gateway_process_tuple)
            # Wait for the gateway to give the green flag
            wait_for_green_flag("gateway", logs_dir, WAITING_TIMEOUT, GATEWAY_GREEN_FLAG)
        except Exception as e:
            cleanup_processes(processes_handles)
            print("Failed to spawn services or gateway or broker")
            print(e)
            exit(1)

if __name__ == "__main__":
    try:
        main()

        # Wait for the user to press enter to shut down the processes
        input("\nAll services are running. Press Enter to shut them down and exit.")

        cleanup_processes(processes_handles)
        exit(0)
    except KeyboardInterrupt:
        print("Interrupted by user. Cleaning up processes...")

        cleanup_processes(processes_handles)
        exit(0)
    except Exception as e:
        print("Failed to run main")
        print(e)

        cleanup_processes(processes_handles)
        exit(1)