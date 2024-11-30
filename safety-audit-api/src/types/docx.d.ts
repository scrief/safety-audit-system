import { IImageOptions } from 'docx';

declare module 'docx' {
  interface IImageOptions {
    data: Buffer | string | Uint8Array;
    transformation?: {
      width?: number;
      height?: number;
    };
    type?: 'jpg' | 'png' | 'gif' | 'bmp' | 'svg';
  }
} 