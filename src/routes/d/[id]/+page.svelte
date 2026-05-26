<script lang="ts">
  import { Button } from '$/components/ui/button';
  import View from '$/components/View.svelte';
  import { stateStore, updateCodeStore } from '$/util/state';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import TagIcon from '~icons/material-symbols/label-outline-rounded';
  import FolderIcon from '~icons/material-symbols/folder-outline-rounded';

  let { data }: { data: PageData } = $props();

  onMount(() => {
    updateCodeStore({
      code: data.diagram.code,
      mermaid: data.diagram.config || '{}',
      updateDiagram: true
    });
  });

  function openInEditor() {
    goto('/edit');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  const title = data.diagram.title || 'Untitled Diagram';
  const authorLabel = data.author?.handle
    ? `@${data.author.handle}`
    : data.author?.name || 'Anonymous';
</script>

<svelte:head>
  <title>{title} — Mermaid Live Editor</title>
  {#if data.diagram.description}
    <meta name="description" content={data.diagram.description} />
  {/if}
</svelte:head>

<div class="flex h-screen flex-col">
  <header class="flex flex-col border-b border-border bg-background">
    <!-- Top bar -->
    <div class="flex items-center gap-3 px-4 py-2">
      <a href="/edit" class="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Editor
      </a>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-sm font-semibold">{title}</h1>
        <p class="text-xs text-muted-foreground">
          by {authorLabel}
          {#if data.diagram.visibility === 'public'}
            · Public
          {:else if data.diagram.visibility === 'unlisted'}
            · Unlisted
          {:else if data.diagram.visibility === 'private'}
            · Private
          {/if}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" onclick={copyLink}>Copy link</Button>
        <Button size="sm" onclick={openInEditor}>
          {#if data.isOwner}
            Edit
          {:else}
            Open in Editor
          {/if}
        </Button>
      </div>
    </div>

    <!-- Metadata bar (description, tags, projects) -->
    {#if data.diagram.description || data.diagram.tags.length > 0 || data.projects.length > 0}
      <div
        class="flex flex-wrap items-center gap-3 border-t border-border/50 px-4 py-1.5 text-xs text-muted-foreground">
        {#if data.diagram.description}
          <span class="max-w-md truncate" title={data.diagram.description}>
            {data.diagram.description}
          </span>
        {/if}

        {#if data.diagram.tags.length > 0}
          <div class="flex items-center gap-1">
            <TagIcon class="size-3.5 shrink-0" />
            {#each data.diagram.tags as tag (tag)}
              <span class="rounded-full bg-accent/10 px-1.5 py-0.5 text-accent">{tag}</span>
            {/each}
          </div>
        {/if}

        {#if data.projects.length > 0}
          <div class="flex items-center gap-1">
            <FolderIcon class="size-3.5 shrink-0" />
            {#each data.projects as project (project.id)}
              <span class="flex items-center gap-1">
                {#if project.color}
                  <span
                    class="inline-block size-2 rounded-full"
                    style="background-color: {project.color}"></span>
                {/if}
                {project.name}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </header>

  <div class="flex-1 overflow-auto bg-background">
    {#if $stateStore.code}
      <View />
    {:else}
      <div class="flex h-full items-center justify-center text-muted-foreground">
        Loading diagram...
      </div>
    {/if}
  </div>
</div>
