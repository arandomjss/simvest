interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({
    className = '',
    width,
    height,
    variant = 'rectangular'
}: SkeletonProps) => {
    const baseClasses = "animate-pulse bg-surface-hover/50";
    
    const variantClasses = {
        text: "rounded",
        circular: "rounded-full",
        rectangular: "rounded-md"
    };

    const style = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};
