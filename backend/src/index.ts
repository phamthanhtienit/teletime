import { app } from "@/app";
import { env } from "@/config/env";

app.listen(env.port, () => {
  console.log(`TeleTime backend dang chay tai http://localhost:${env.port}`);
});
