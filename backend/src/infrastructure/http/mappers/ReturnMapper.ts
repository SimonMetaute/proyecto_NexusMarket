import type { Return } from '../../../domain/entities/Return.js';

/**
 * Maps a return case to the REST representation. `status` mirrors
 * `returnStatus` for the shared badge helpers.
 */
export function toReturnResponse(returnCase: Return): Record<string, unknown> {
  return {
    returnId: returnCase.returnId,
    orderId: returnCase.orderId,
    invoiceId: returnCase.invoiceId,
    reason: returnCase.reason,
    returnStatus: returnCase.returnStatus,
    status: returnCase.returnStatus,
    requestDate: returnCase.requestDate,
    refundAmount: returnCase.refundAmount,
    evidence: returnCase.evidence,
    receivedDate: returnCase.receivedDate,
  };
}
