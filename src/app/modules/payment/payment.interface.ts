interface IPaymentWebhookData {
  status: string;
  tran_id: string;
  val_id?: string;
  amount?: number;
  currency?: string;
}
