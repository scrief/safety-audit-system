import { RouteObject } from 'react-router-dom';
import { SvgIconComponent } from '@mui/icons-material';

export type CustomRouteObject = RouteObject & {
  label: string;
  icon?: SvgIconComponent;
  showInNav?: boolean;
}; 