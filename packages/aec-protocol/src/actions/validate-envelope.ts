import type { ActionEnvelope } from "./envelope.js";
import { parseActionPayload } from "./payloads.js";

/**
 * 校验 envelope 外层 + 与 action 对应的 payload 结构。
 */
export function validateActionEnvelope(envelope: ActionEnvelope): ActionEnvelope {
  parseActionPayload(envelope.action, envelope.payload);
  return envelope;
}
