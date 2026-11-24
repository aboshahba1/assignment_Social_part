import bootstrap from "./app.bootstrap.js";
bootstrap().catch((error) => {
    console.error("Application failed to start:", error);
    process.exit(1);
});
