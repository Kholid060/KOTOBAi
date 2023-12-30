function UiCircleProgress({
  value,
  ...props
}: { value: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="200"
      height="200"
      viewBox="-25 -25 250 250"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotate(-90deg)' }}
      {...props}
    >
      <circle
        r="90"
        cx="100"
        cy="100"
        className="text-muted"
        fill="transparent"
        strokeWidth="14px"
        strokeDashoffset="0"
        stroke="currentColor"
        strokeDasharray="566"
      ></circle>
      <circle
        r="90"
        cx="100"
        cy="100"
        strokeWidth="14px"
        fill="transparent"
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray="566"
        className="text-emerald-400"
        strokeDashoffset={566 - (value / 100) * 566}
      ></circle>
    </svg>
  );
}

export default UiCircleProgress;
