import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  backend_base_url: process.env.BACKEND_BASE_URL,
  api_key: process.env.API_KEY,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    gen_salt: process.env.GEN_SALT,
    expires_in: process.env.EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  space: {
    access_id: process.env.ACCESS_ID,
    access_key: process.env.ACCESS_KEY,
    space_name: process.env.SPACE_NAME,
    region: process.env.REGION,
    end_point: process.env.ENDPOINT,
  },
  ssl: {
    store_id: process.env.SSL_APP_ID,
    store_password: process.env.SSL_PASSWORD,
    isLive: process.env.IS_LIVE,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
};
