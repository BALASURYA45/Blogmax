import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes, ReactNode } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: ReactNode;
};

const SafeImage = ({ src, fallback, onError, ...rest }: Props) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) return <>{fallback ?? null}</>;

  return (
    <img
      {...rest}
      src={src}
      onError={(e) => {
        setErrored(true);
        onError?.(e);
      }}
    />
  );
};

export default SafeImage;
