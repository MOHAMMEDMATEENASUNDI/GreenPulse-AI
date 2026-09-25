/**
 * @license
 * GreenPulse AI — Team & Role Management Mock Service
 * Mirrors the asynchronous service contracts in api-services.ts
 */

export type TeamRole = 'Admin' | 'Facility Manager' | 'Auditor';
export type TeamMemberStatus = 'Active' | 'Invited';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  isNewlyCreated?: boolean;
}

export const TeamService = {
  async getTeamMembers(): Promise<TeamMember[]> {
    return [
      {
        id: 'usr-001',
        name: 'Rajesh Kulkarni',
        email: 'r.kulkarni@apexmanufacturing.com',
        role: 'Admin',
        status: 'Active',
      },
      {
        id: 'usr-002',
        name: 'Sunita Deshmukh',
        email: 's.deshmukh@apexmanufacturing.com',
        role: 'Facility Manager',
        status: 'Active',
      },
      {
        id: 'usr-003',
        name: 'Vikramaditya Mehta',
        email: 'v.mehta@kpmg-audit.in',
        role: 'Auditor',
        status: 'Active',
      },
      {
        id: 'usr-004',
        name: 'Priya Sharma',
        email: 'p.sharma@apexmanufacturing.com',
        role: 'Facility Manager',
        status: 'Invited',
      },
    ];
  },
};

/**
 * Direct exported helper matching standard async mock-data conventions
 */
export const getTeamMembers = (): Promise<TeamMember[]> => {
  return TeamService.getTeamMembers();
};
