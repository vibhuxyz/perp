import type { Producer, Consumer, KafkaMessage } from "kafkajs";
import { Kafka, Partitioners } from "kafkajs";

export const kafka = new Kafka({
  clientId: "perp",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

let producer: Producer | null = null;

export const getProducer = async () => {
  if (!producer) {
    producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    await producer.connect();
  }

  return producer;
};

export const sendMessage = async (
  topic: string,
  message: object,
  key?: string,
) => {
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [{ key: key || "default", value: JSON.stringify(message) }],
  });
};

export const createConsumer = (groupId: string) => {
  return kafka.consumer({ groupId, sessionTimeout: 30000 });
};

export function parseMessage<T>(message: KafkaMessage): T | null {
  if (!message.value) {
    return null;
  }

  try {
    const jsonString = message.value.toString();

    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    return null;
  }
}
