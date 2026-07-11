export type ScenePacketJobBase = {
  id: string;
  enqueuedAtMs: number;
};

export type ScenePacketJobClaim = {
  ownerId: string;
  claimedAtMs: number;
  claimExpiresAtMs: number;
};

export type ScenePacketClaimedJob<TJob extends ScenePacketJobBase> = TJob & {
  claim: ScenePacketJobClaim;
};

export type ScenePacketJobQueueStatus = {
  queueDepth: number;
  claimedCount: number;
  oldestQueuedMs: number | null;
  oldestClaimedMs: number | null;
};

export type ScenePacketMemoryJobQueue<TJob extends ScenePacketJobBase> = {
  enqueue(job: TJob): Promise<void>;
  claim(nowMs: number): Promise<ScenePacketClaimedJob<TJob> | undefined>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
  status(nowMs: number): Promise<ScenePacketJobQueueStatus>;
};

export function createScenePacketMemoryJobQueue<TJob extends ScenePacketJobBase>(options: {
  ownerId?: string;
  claimTtlMs?: number;
} = {}): ScenePacketMemoryJobQueue<TJob> {
  const pending = new Map<string, TJob>();
  const completed = new Set<string>();
  const failed = new Map<string, string>();
  const ownerId = options.ownerId ?? "memory-worker";
  const claimTtlMs = Math.max(1, Math.floor(options.claimTtlMs ?? 30_000));

  return {
    async enqueue(job) {
      if (completed.has(job.id)) return;
      pending.set(job.id, job);
    },
    async claim(nowMs) {
      let oldest: TJob | undefined;
      for (const job of pending.values()) {
        if (!oldest || job.enqueuedAtMs < oldest.enqueuedAtMs) oldest = job;
      }
      if (!oldest) return undefined;
      pending.delete(oldest.id);
      return {
        ...oldest,
        claim: {
          ownerId,
          claimedAtMs: nowMs,
          claimExpiresAtMs: nowMs + claimTtlMs,
        },
      };
    },
    async complete(jobId) {
      pending.delete(jobId);
      failed.delete(jobId);
      completed.add(jobId);
    },
    async fail(jobId, error) {
      pending.delete(jobId);
      failed.set(jobId, error);
    },
    async status(nowMs) {
      let oldestQueuedMs: number | null = null;
      for (const job of pending.values()) {
        const age = Math.max(0, nowMs - job.enqueuedAtMs);
        oldestQueuedMs = oldestQueuedMs === null ? age : Math.max(oldestQueuedMs, age);
      }
      return {
        queueDepth: pending.size,
        claimedCount: 0,
        oldestQueuedMs,
        oldestClaimedMs: null,
      };
    },
  };
}
