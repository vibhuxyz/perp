import { getProducer, sendMessage } from "@repo/shared";
import type { Producer } from "kafkajs";

let producerInstance: Producer | null = null;

export async function initProducer() {
  if (!producerInstance) {
    producerInstance = await getProducer();
  }
  return producerInstance;
}

export async function publishCommand(
  type: string,
  payload: object,
  key: string,
) {
  await sendMessage(
    "order.commands",
    {
      type,
      payload,
      timestamp: Date.now(),
      commandId: crypto.randomUUID(),
    },
    key,
  );
}
