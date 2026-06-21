import { startSandboxWorker } from './sandbox-worker.js';

async function main() {
  const handle = await startSandboxWorker();

  const shutdown = async (signal: string) => {
    console.info(`Received ${signal}, shutting down worker`);
    await handle.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
