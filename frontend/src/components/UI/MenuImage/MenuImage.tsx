import { ImgHTMLAttributes, useEffect, useState } from 'react';

const FALLBACK_IMAGE_SRC =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"%3E%3Crect width="160" height="120" fill="%23fff7e0"/%3E%3Ccircle cx="80" cy="56" r="28" fill="%23ffc72c"/%3E%3Crect x="45" y="72" width="70" height="9" rx="4.5" fill="%23bd0017"/%3E%3Crect x="54" y="40" width="52" height="8" rx="4" fill="%23292929" opacity=".18"/%3E%3C/svg%3E';

interface MenuImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> {
  src?: string | null;
}

const MenuImage = ({ src, alt, onError, ...props }: MenuImageProps) => {
  const [didFail, setDidFail] = useState(false);
  const imageSrc = src && !didFail ? src : FALLBACK_IMAGE_SRC;

  useEffect(() => {
    setDidFail(false);
  }, [src]);

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      onError={(event) => {
        if (!didFail) {
          setDidFail(true);
        }

        onError?.(event);
      }}
    />
  );
};

export default MenuImage;
