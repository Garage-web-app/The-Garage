export function findTopic(topics: string[], topic: string): string {
    const foundTopic = topics.find((t) => t === topic);
    if (foundTopic) {
        return foundTopic;
    }
    throw new Error(`Topic ${topic} not found`);
}
