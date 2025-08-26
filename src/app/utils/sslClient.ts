import SSLCommerzPayment from "sslcommerz-lts";
import config from "../../config";

const sslClient = new SSLCommerzPayment(
  config.ssl.store_id as string,
  config.ssl.store_password as string,
  config.ssl.isLive === "true"
);

export default sslClient;
