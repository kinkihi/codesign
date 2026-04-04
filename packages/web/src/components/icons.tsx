interface IconProps {
  size?: number;
  weight?: string;
  className?: string;
}

export function CanvasIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 3.5H14M3.5 1.5V14.5M2 12.5H14M12.5 1.5V14.5"
        stroke="currentColor"
      />
    </svg>
  );
}

export function SkillsIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 5.5C8 4.96957 8.21071 4.46086 8.58579 4.08579C8.96086 3.71071 9.46957 3.5 10 3.5H14.5V12.5H10C9.46957 12.5 8.96086 12.7107 8.58579 13.0858C8.21071 13.4609 8 13.9696 8 14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 12.5H6C6.53043 12.5 7.03914 12.7107 7.41421 13.0858C7.78929 13.4609 8 13.9696 8 14.5V5.5C8 4.96957 7.78929 4.46086 7.41421 4.08579C7.03914 3.71071 6.53043 3.5 6 3.5H1.5V12.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 6H12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 8H12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10H12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
