import PeerNet from "./src";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async function main() {
  try {
    const keys = PeerNet.createNewKeys();
    const options = {
      identity: {
        keyPair: keys,
      },
    };
    const node = new PeerNet(options);
    await sleep(1000);
    const key: string = await node.storage.add({
      hello: "Hello world!",
    });
    console.log(key);
    const data: any = await node.storage.get(key);
    console.log(data);
  } catch (e) {
    console.log(e.message);
  }
})();
