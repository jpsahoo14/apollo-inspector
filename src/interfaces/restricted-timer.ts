import { Timer } from "timer-node";

export class RestrictedTimer {
  private timer;
  constructor(timer: Timer) {
    this.timer = timer;
  }

  public getCurrentMs() {
    return this.timer.ms();
  }
}
