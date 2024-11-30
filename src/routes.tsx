import React from 'react';
import { RouteObject } from 'react-router-dom';
import Home from './pages/Home';
import FormBuilder from './pages/FormBuilder';
import FormResponses from './pages/FormResponses';
import SavedTemplates from './pages/SavedTemplates';
import ClientList from './pages/ClientList';
import ClientProfile from './pages/ClientProfile';
import NewAudit from './pages/NewAudit';
import TemplateBuilder from './pages/TemplateBuilder';
import AuditForm from './pages/AuditForm';
import { 
  PeopleAlt as PeopleAltIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';

type CustomRouteObject = RouteObject & {
  label: string;
  icon?: SvgIconComponent;
  showInNav?: boolean;
};

export const routes: CustomRouteObject[] = [
  {
    path: '/',
    element: <Home />,
    label: 'Home',
    icon: HomeIcon
  },
  {
    path: '/form-builder',
    element: <FormBuilder />,
    label: 'Form Builder',
    icon: EditIcon
  },
  {
    path: '/form-responses',
    element: <FormResponses />,
    label: 'Form Responses',
    icon: AssessmentIcon
  },
  {
    path: '/saved-templates',
    element: <SavedTemplates />,
    label: 'Saved Templates',
    icon: SaveIcon
  },
  {
    path: '/clients',
    element: <ClientList />,
    label: 'Clients',
    icon: PeopleAltIcon
  },
  {
    path: '/clients/new',
    element: <ClientProfile />,
    label: 'New Client',
    showInNav: false
  },
  {
    path: '/clients/:id',
    element: <ClientProfile />,
    label: 'Client Profile',
    showInNav: false
  },
  {
    path: '/new-audit',
    element: <NewAudit />,
    label: 'New Audit',
    icon: AssignmentIcon,
    showInNav: true
  },
  {
    path: '/forms/new/:clientId',
    element: <FormBuilder />,
    label: 'New Form',
    showInNav: false
  },
  {
    path: '/template-builder/:id',
    element: <TemplateBuilder />,
    label: 'Template Builder',
    showInNav: false
  },
  {
    path: '/audit/:clientId/:templateId',
    element: <AuditForm />,
    label: 'Audit Form',
    showInNav: false
  }
]; 