import { main } from "./src/main";

const sec = 1000;
const min = 60;
const minCount = 10;
const delay = sec * min * minCount;
const run = () => {
  let timerId = setTimeout(async function foo() {
    await main();
    timerId = setTimeout(foo, delay);
  }, 1000);
};

run();