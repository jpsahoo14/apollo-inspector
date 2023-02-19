import { Timer } from "timer-node";

export class RestrictedTimer {
  private timer;
  constructor(timer: Timer) {
    this.timer = timer;
  }

  public getCurrentMs(): number {
    return this.timer.ms();
  }
}
