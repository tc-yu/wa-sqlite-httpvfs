import MyWorker from "./worker.ts?worker";

const worker = new MyWorker();

const pendingRequests = new Map();

worker.onmessage = (event) => {
  const { id, result, error } = event.data;
  const handlers = pendingRequests.get(id);

  if (!handlers) return;
  pendingRequests.delete(id);

  if (error) {
    handlers.reject(new Error(error));
  } else {
    handlers.resolve(result);
  }
};

function runInWorker(payload: string) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ id, payload });
  });
}

// document.body.textContent = JSON.stringify(await hello());
// hello();

const input = document.querySelector<HTMLInputElement>("#text-input")!;
const button = document.querySelector<HTMLButtonElement>("#update-btn")!;
const result = document.querySelector<HTMLParagraphElement>("#result")!;

console.log(input.value);
worker.postMessage(21);

button.addEventListener("click", async () => {
  button.disabled = true;
  result.textContent = "Loading...";
  try {
    result.textContent = JSON.stringify(await runInWorker(input.value));
  } catch (error) {
    result.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    button.disabled = false;
  }
});
