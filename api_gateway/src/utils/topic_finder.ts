/**
 * Finds a topic in the given list of topics.
 * @param topics - The list of topics to search in.
 * @param topic - The topic to find.
 * @returns The found topic.
 * @throws {Error} If the topic is not found in the list of topics.
 */
export function findTopic(topics: string[], topic: string): string {
    const foundTopic = topics.find((t) => t === topic);
    if (foundTopic) {
        return foundTopic;
    }
    throw new Error(`Topic ${topic} not found`);
}
