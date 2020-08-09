import React from 'react';
import { SVG } from '../../types/SVG';

export const Unread: React.FC<SVG> = (props) => {
    const { color, size, title, style } = props;
    return (
        <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 20 20"
            style={style}
        >
            <title>{title}</title>
            <path
                d="M17 3c-1.104 0-2 0.895-2 2s0.896 2 2 2 2-0.895 2-2c0-1.105-0.896-2-2-2zM12.5 4h-11c-0.276 0-0.5 0.224-0.5 0.5v1c0 0.276 0.224 0.5 0.5 0.5h11c0.276 0 0.5-0.224 0.5-0.5v-1c0-0.276-0.224-0.5-0.5-0.5zM12.5 9h-11c-0.276 0-0.5 0.224-0.5 0.5v1c0 0.276 0.224 0.5 0.5 0.5h11c0.276 0 0.5-0.224 0.5-0.5v-1c0-0.276-0.224-0.5-0.5-0.5zM12.5 14h-11c-0.276 0-0.5 0.224-0.5 0.5v1c0 0.276 0.224 0.5 0.5 0.5h11c0.276 0 0.5-0.224 0.5-0.5v-1c0-0.276-0.224-0.5-0.5-0.5z"
                fill={color}
            />
        </svg>
    );
};
