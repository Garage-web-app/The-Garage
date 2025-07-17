import argparse
import shlex
import subprocess
import os
import dotenv
import re
import shutil
import time
import psutil

# Gather up the processes tuples. Each tuple is (process, stdout file, stderr file) we will use this later to terminate the processes
processes_handles = []
# Gather up the db paths. This is used to terminate mongo instances later
mongo_paths = []

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

            cmd = "npm run dropdb"
            
            try:
                subprocess.run(
                    shlex.split(cmd),
                    cwd=f"{os.path.join(services_root, service)}",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True
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


def kill_process_tree(proc, grace_period=3):
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
        parent = psutil.Process(proc.pid)
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
        print(f"Failed to kill process tree for PID {proc.pid}: {e}")
        raise e

def cleanup_processes(processes, mongo_paths: list):
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
    for process, out_file, err_file in processes:
        try:
            print(f"Terminating process with PID {process.pid}...")
            if process.poll() is None:
                kill_process_tree(process)
                print(f"Successfully terminated process with PID {process.pid}")
            else:
                print(f"Process with PID {process.pid} is already terminated")
        except Exception as e:
            print(f"Failed to terminate process with PID {process.pid}:\n{e}")
        finally:
            out_file.close()
            err_file.close()

    # Terminate the mongo instances
    kill_mongo_instances(mongo_paths)
    print("Cleanup complete.")

def kill_mongo_instances(db_paths: list):
    """
    Terminate the mongod instances for the given db paths.

    This function is used to shut down the mongod instances that are spawned by this script.

    Parameters
    ----------
    db_paths : list
        List of paths to MongoDB data directories

    Raises
    ------
    Exception
        If there is an error shutting down a mongod instance
    """
    # Terminate the mongod instances
    for db_path in db_paths:
        try:
            # Check if the dbpath exists
            if os.path.exists(db_path):
                print(f"Shutting down mongod instance at {db_path}...")

                subprocess.run(
                    ["mongod", "--shutdown", "--dbpath", db_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True
                )

                print(f"Successfully shut down mongod at {db_path}")
            else:
                print(f"dbpath does not exist: {db_path}")
        # Handle subprocess errors
        except subprocess.CalledProcessError as e:
                print(f"Failed to shut down mongod at {db_path}")
                print(f"stdout:\n{e.stdout.decode()}")
                print(f"stderr:\n{e.stderr.decode()}")
        except Exception as e:
            print(f"Unexpected error while shutting down {db_path}:\n{e}")

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
        command = "npm run dev"
        
        # The service i slong running. It will be in the background
        try:
            # Save the output and errors to the log files
            out_file = open(out_log_file, "w")
            err_file = open(err_log_file, "w")

            process = subprocess.Popen(shlex.split(command), cwd=cwd, env=env_copy, stdout=out_file, stderr=err_file)
            print(f"{service} spawned. Check the log files for errors.")

            processes.append((process, out_file, err_file))
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
    command = "npm run dev"

    print("Spawning broker")

    # The broker is long running. It will be in the background
    try:
        # Save the output and errors to the log files
        out_file = open(out_log_file, "w")
        err_file = open(err_log_file, "w")

        process = subprocess.Popen(shlex.split(command), cwd=cwd, env=env_copy, stdout=out_file, stderr=err_file)
        print("Broker spawned. Check the log files for errors.")

        return (process, out_file, err_file)
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
        command = "npm run test"
    else:
        command = "npm run dev"

    # The gateway is long running. It will be in the background
    try:
        # Save the output and errors to the log files
        out_file = open(out_log_file, "w")
        err_file = open(err_log_file, "w")

        process = subprocess.Popen(shlex.split(command), cwd=cwd, env=env_copy, stdout=out_file, stderr=err_file)
        print("Gateway spawned. Check the log files for errors.")

        return (process, out_file, err_file)
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
    # Log files to save the output and errors to
    out_log_file = f"{os.path.join(logs_dir, 'create_mongo_instances.out')}"
    err_log_file = f"{os.path.join(logs_dir, 'create_mongo_instances.err')}"
    # The base dir is where the mongo data will be stored
    # Please note that this is not the dir that mongo itself uses by default
    # as mongo uses ~/data/db
    mongo_base_path = f"{os.path.join(os.path.expanduser('~'), 'mongo_data')}"

    # List to store the paths to the mongo instances
    database_paths = []

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
            match = re.search(r"mongodb://localhost:(\d+)", mongo_uri)
            if not match:
                raise ValueError(f"Invalid DATABASE_URI format in {service}")
            port = match.group(1)

            sliced_mongo_uri = mongo_uri.split("/")

            database_name = sliced_mongo_uri[-1]
            
            # Create the path for the mongo instance for the service
            mongo_path = f"{os.path.join(mongo_base_path, database_name)}"

            # Add the path to the databases path
            database_paths.append(mongo_path)

            # Create the path for the mongo log for the service
            mongo_log_path = f"{os.path.join(mongo_base_path, f"{database_name}.log")}"
            
            # Create the mongo dir for the service
            try:
                os.makedirs(mongo_path, exist_ok=True)
                print(f"Created mongo dir {mongo_path} for {service}")
            except Exception as e:
                print(f"Failed to create mongo dir {mongo_path} for {service}")
                raise e

            # Mongo instance creation command
            mongo_creation_cmd = f"mongod --port {port} --dbpath {mongo_path} --logpath {mongo_log_path} --fork"
            
            # Use subprocess to run the command
            try:
                # Create the log files and save the output to it
                with open(out_log_file, "a") as f, open(err_log_file, "a") as e:
                    # Run the instance creation command
                    subprocess.run(shlex.split(mongo_creation_cmd), stdout=f, stderr=e)
            except FileNotFoundError as e:
                database_paths.remove(mongo_path)
                kill_mongo_instances(database_paths)

                print("Failed to create log file")
                raise e
            except Exception as e:
                database_paths.remove(mongo_path)
                kill_mongo_instances(database_paths)
                print(f"Failed to create mongo instance for {service}")
                raise e
            
            print(f"Mongo instance created for {service} on port {port}. check {out_log_file}", 
                  "for logs.\n")

    return database_paths

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
    WAITING_TIMEOUT = 30

    # Create the argument parser for parsing the arguments passed to the script
    parser = argparse.ArgumentParser()
    # Add the arguments
    parser.add_argument("--test", "-t", action="store_true", help="Run Postman tests")
    parser.add_argument("--create_mongo_instances", "-c", action="store_true", help="Create the mongo instances")

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

    # delete the logs dir to remove data from previous runs
    try:
        if os.path.exists(logs_dir):
            shutil.rmtree(logs_dir)
    except Exception as e:
        print("Failed to delete logs dir")
        raise e

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

    # If the create_mongo_instances argument is passed, create the mongo instances
    if args.create_mongo_instances:
        try:      
            database_paths = create_mongo_instances(services, ["notification_service"], env_file_name, services_root, logs_dir)
            mongo_paths.extend(database_paths)
        except Exception as e:
            print("Failed to create mongo instances")
            print(e)

    # If the test argument is passed we run gateway in test mode, otherwise we run it in dev mode
    if args.test:
        try:
            # Clear the databases
            clear_databases(services, ["notification_service"], services_root)

            # Spawn the broker
            broker_process_tuple = spawn_broker(broker_path, logs_dir, env_file_name)
            processes_handles.append(broker_process_tuple)
            # Wait for the broker to give the green flag
            wait_for_green_flag("broker", logs_dir, 30, BROKER_GREEN_FLAG)

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
                cleanup_processes(processes_handles, mongo_paths)
                exit(1)

            # If the tests passed, exit with a zero exit code
            print("\n All tests passed.")
            # Always terminate the processes before exiting
            cleanup_processes(processes_handles, mongo_paths)
            exit(0)
        except Exception as e:
            cleanup_processes(processes_handles, mongo_paths)
            print("Failed to spawn services or gateway or broke or to clear databases.")
            print(e)
            exit(1)
    else:
        try:
            # Spawn the broker
            broker_process_tuple = spawn_broker(broker_path, logs_dir, env_file_name)
            processes_handles.append(broker_process_tuple)
            # Wait for the broker to give the green flag
            wait_for_green_flag("broker", logs_dir, 30, BROKER_GREEN_FLAG)

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
            cleanup_processes(processes_handles, mongo_paths)
            print("Failed to spawn services or gateway or broker")
            print(e)
            exit(1)

if __name__ == "__main__":
    try:
        main()
        input("\nAll services are running. Press Enter to shut them down and exit.")

        cleanup_processes(processes_handles, mongo_paths)
        exit(0)
    except KeyboardInterrupt:
        print("Interrupted by user. Cleaning up processes...")

        cleanup_processes(processes_handles, mongo_paths)
        exit(0)
    except Exception as e:
        print("Failed to run main")
        print(e)

        cleanup_processes(processes_handles, mongo_paths)
        exit(1)