import app from "./src/app.ts";

app.listen(process.env.PORT || 3000, () => {
  console.info("[INFO] Remittance Server started");
});
