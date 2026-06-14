import type { Server } from 'http';

function isPortInUseError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'EADDRINUSE'
  );
}

export async function listenOnAvailablePort(
  startServer: (port: number, host: string) => Server,
  preferredPort: number,
  host = '0.0.0.0',
  maxAttempts = 10
): Promise<{ port: number; host: string; server: Server }> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = preferredPort + attempt;

    try {
      const server = await new Promise<Server>((resolve, reject) => {
        const server = startServer(port, host);

        const onError = (error: unknown) => {
          server.off('listening', onListening);
          reject(error);
        };

        const onListening = () => {
          server.off('error', onError);
          resolve(server);
        };

        server.once('error', onError);
        server.once('listening', onListening);
      });

      return { port, host, server };
    } catch (error) {
      if (!isPortInUseError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      console.warn(`[WARN] Port ${port} is already in use. Trying ${port + 1}...`);
    }
  }

  throw new Error('Unable to find an available port.');
}
