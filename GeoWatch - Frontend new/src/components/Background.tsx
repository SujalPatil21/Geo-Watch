function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06141b] via-[#0d1b26] to-[#06141b]" />
      <div className="bg-grid-pattern absolute inset-0 opacity-60" />
      <div className="animate-blob absolute -left-24 -top-32 h-[36rem] w-[36rem] rounded-full bg-surface/90 blur-3xl" />
      <div
        className="animate-blob absolute -right-40 top-1/4 h-[32rem] w-[32rem] rounded-full bg-deep/80 blur-3xl"
        style={{ animationDelay: '-4s' }}
      />
      <div
        className="animate-blob absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-mid/50 blur-3xl"
        style={{ animationDelay: '-8s' }}
      />
      <div
        className="animate-blob absolute bottom-1/4 -left-16 h-[22rem] w-[22rem] rounded-full bg-deep/70 blur-3xl"
        style={{ animationDelay: '-11s' }}
      />
    </div>
  )
}

export default Background