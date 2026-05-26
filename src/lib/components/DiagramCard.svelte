<script lang="ts">
  import { Separator } from '$/components/ui/separator';
  import StarIcon from '~icons/material-symbols/star-rounded';
  import StarOutlineIcon from '~icons/material-symbols/star-outline-rounded';
  import FolderIcon from '~icons/material-symbols/folder-outline-rounded';
  import EditIcon from '~icons/material-symbols/edit-outline-rounded';
  import DeleteIcon from '~icons/material-symbols/delete-outline-rounded';
  import MoreIcon from '~icons/material-symbols/more-vert';
  import LockIcon from '~icons/material-symbols/lock-outline';
  import LinkIcon from '~icons/material-symbols/link-rounded';
  import PublicIcon from '~icons/material-symbols/public';

  // ─── Types ──────────────────────────────────────────────────────────────────

  export interface DiagramSummary {
    id: string;
    userId: string | null;
    title: string | null;
    visibility: string;
    starred: boolean;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
  }

  export interface FolderSummary {
    id: string;
    name: string;
  }

  interface Props {
    diagram: DiagramSummary;
    mode: 'grid' | 'list';
    folders?: FolderSummary[];
    onstar?: (diagram: DiagramSummary) => void;
    ondelete?: (id: string) => void;
    onmove?: (diagramId: string, folderId: string | null) => void;
  }

  let { diagram, mode, folders = [], onstar, ondelete, onmove }: Props = $props();

  // ─── Local state ────────────────────────────────────────────────────────────

  let menuOpen = $state(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function visibilityLabel(v: string): string {
    if (v === 'private') return 'Private';
    if (v === 'unlisted') return 'Unlisted';
    return 'Public';
  }

  const title = $derived(diagram.title || 'Untitled');
  const folderName = $derived(
    diagram.folderId ? (folders.find((f) => f.id === diagram.folderId)?.name ?? null) : null
  );
</script>

{#if mode === 'grid'}
  <!-- ─── Grid card ──────────────────────────────────────────────────────── -->
  <div
    class="group relative flex flex-col rounded-lg border border-border bg-card transition-colors hover:border-accent/50">
    <!-- Thumbnail area -->
    <a
      href="/d/{diagram.id}"
      class="block h-32 overflow-hidden rounded-t-lg bg-muted/30 no-underline">
      <!-- Placeholder — thumbnail rendering can be added later -->
      <div class="flex h-full items-center justify-center text-3xl text-muted-foreground/30">
        📊
      </div>
    </a>

    <!-- Card body -->
    <a href="/d/{diagram.id}" class="flex flex-1 flex-col gap-2 p-3 no-underline">
      <h3 class="line-clamp-2 text-sm font-medium text-foreground">{title}</h3>
      <div class="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        {#if diagram.visibility === 'private'}
          <LockIcon class="size-3" />
        {:else if diagram.visibility === 'unlisted'}
          <LinkIcon class="size-3" />
        {:else}
          <PublicIcon class="size-3" />
        {/if}
        <span>{visibilityLabel(diagram.visibility)}</span>
        <span class="ml-auto">{formatDate(diagram.updatedAt)}</span>
      </div>
    </a>

    <!-- Actions bar -->
    <div class="flex items-center border-t border-border px-2 py-1">
      <button
        class="rounded p-1.5 transition-colors hover:bg-muted"
        title={diagram.starred ? 'Unstar' : 'Star'}
        onclick={() => onstar?.(diagram)}>
        {#if diagram.starred}
          <StarIcon class="size-4 text-yellow-500" />
        {:else}
          <StarOutlineIcon class="size-4 text-muted-foreground" />
        {/if}
      </button>

      <a href="/d/{diagram.id}" class="rounded p-1.5 transition-colors hover:bg-muted" title="Open">
        <EditIcon class="size-4 text-muted-foreground" />
      </a>

      <div class="relative ml-auto">
        <button
          class="rounded p-1.5 transition-colors hover:bg-muted"
          title="More actions"
          onclick={() => (menuOpen = !menuOpen)}>
          <MoreIcon class="size-4 text-muted-foreground" />
        </button>
        {#if menuOpen}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="absolute right-0 bottom-full z-20 mb-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md"
            onmouseleave={() => (menuOpen = false)}>
            {#if folders.length > 0}
              <div class="px-2 py-1 text-xs font-medium text-muted-foreground">Move to folder</div>
              {#if diagram.folderId}
                <button
                  class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  onclick={() => {
                    onmove?.(diagram.id, null);
                    menuOpen = false;
                  }}>
                  <FolderIcon class="size-3.5" /> Root
                </button>
              {/if}
              {#each folders.filter((f) => f.id !== diagram.folderId) as folder (folder.id)}
                <button
                  class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  onclick={() => {
                    onmove?.(diagram.id, folder.id);
                    menuOpen = false;
                  }}>
                  <FolderIcon class="size-3.5" />
                  <span class="truncate">{folder.name}</span>
                </button>
              {/each}
              <Separator class="my-1" />
            {/if}
            <button
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              onclick={() => {
                ondelete?.(diagram.id);
                menuOpen = false;
              }}>
              <DeleteIcon class="size-3.5" /> Delete
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- ─── List row ───────────────────────────────────────────────────────── -->
  <div class="group flex items-center gap-4 py-3">
    <button
      class="flex-shrink-0 rounded p-1 transition-colors hover:bg-muted"
      title={diagram.starred ? 'Unstar' : 'Star'}
      onclick={() => onstar?.(diagram)}>
      {#if diagram.starred}
        <StarIcon class="size-4 text-yellow-500" />
      {:else}
        <StarOutlineIcon class="size-4 text-muted-foreground" />
      {/if}
    </button>

    <a href="/d/{diagram.id}" class="flex flex-1 flex-col gap-0.5 no-underline">
      <span class="text-sm font-medium text-foreground">{title}</span>
      <span class="flex items-center gap-2 text-xs text-muted-foreground">
        {#if diagram.visibility === 'private'}
          <LockIcon class="size-3" />
        {:else if diagram.visibility === 'unlisted'}
          <LinkIcon class="size-3" />
        {:else}
          <PublicIcon class="size-3" />
        {/if}
        {visibilityLabel(diagram.visibility)}
        {#if folderName}
          <span>· {folderName}</span>
        {/if}
      </span>
    </a>

    <span class="hidden text-xs text-muted-foreground sm:block">
      {formatDate(diagram.updatedAt)}
    </span>

    <div class="flex items-center gap-1">
      <a
        href="/d/{diagram.id}"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Open">
        <EditIcon class="size-4" />
      </a>
      <button
        class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
        title="Delete"
        onclick={() => ondelete?.(diagram.id)}>
        <DeleteIcon class="size-4" />
      </button>
    </div>
  </div>
{/if}
