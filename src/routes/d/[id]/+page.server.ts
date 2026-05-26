import { db } from '$lib/server/db';
import {
  diagrams,
  users,
  diagramShares,
  orgMembers,
  projectDiagrams,
  projects
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

async function checkShareAccess(diagramId: string, userId: string): Promise<boolean> {
  const directShare = await db.query.diagramShares?.findFirst({
    where: and(eq(diagramShares.diagramId, diagramId), eq(diagramShares.sharedWithUserId, userId))
  });
  if (directShare) return true;

  const userOrgs = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId));

  for (const { orgId } of userOrgs) {
    const orgShare = await db.query.diagramShares?.findFirst({
      where: and(eq(diagramShares.diagramId, diagramId), eq(diagramShares.sharedWithOrgId, orgId))
    });
    if (orgShare) return true;
  }

  return false;
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const diagram = await db.query.diagrams.findFirst({
    where: eq(diagrams.id, params.id)
  });

  if (!diagram) {
    error(404, 'Diagram not found');
  }

  // Access control: private requires auth + ownership or share access
  if (diagram.visibility === 'private') {
    if (!locals.user) {
      redirect(302, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
    }
    if (diagram.userId !== locals.user.id) {
      const hasAccess = await checkShareAccess(diagram.id, locals.user.id);
      if (!hasAccess) {
        error(404, 'Diagram not found');
      }
    }
  }

  // Fetch author info
  let author: { name: string | null; handle: string | null } | null = null;
  if (diagram.userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, diagram.userId),
      columns: { name: true, handle: true }
    });
    author = user ?? null;
  }

  // Fetch projects this diagram belongs to
  let diagramProjects: { color: string | null; id: string; name: string }[] = [];
  try {
    const pds = await db
      .select({
        projectId: projectDiagrams.projectId,
        projectName: projects.name,
        projectColor: projects.color
      })
      .from(projectDiagrams)
      .innerJoin(projects, eq(projectDiagrams.projectId, projects.id))
      .where(eq(projectDiagrams.diagramId, diagram.id));
    diagramProjects = pds.map((p) => ({
      color: p.projectColor,
      id: p.projectId,
      name: p.projectName
    }));
  } catch {
    // Projects table may not exist yet during migration
  }

  // Parse tags
  let tags: string[] = [];
  if (diagram.tags) {
    try {
      tags = JSON.parse(diagram.tags);
    } catch {
      // Invalid JSON — ignore
    }
  }

  const isOwner = locals.user?.id === diagram.userId;

  return {
    author,
    diagram: {
      code: diagram.code,
      config: diagram.config,
      createdAt: diagram.createdAt.toISOString(),
      description: (diagram as unknown as { description?: string }).description ?? null,
      id: diagram.id,
      tags,
      title: diagram.title,
      updatedAt: diagram.updatedAt.toISOString(),
      visibility: diagram.visibility
    },
    isOwner,
    projects: diagramProjects
  };
};
