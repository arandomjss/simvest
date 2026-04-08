export const DemoBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-[#F8FAFC]">
      <div
        className={[
          "pointer-events-none absolute inset-0",
          // grid
          "bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)]",
          "bg-[size:14px_24px]",
          // fade the grid with a top-centered radial mask
          "[mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_75%,transparent_110%)]",
          "[-webkit-mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_75%,transparent_110%)]",
          "[mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat]",
        ].join(" ")}
      />
    </div>
  );
}
