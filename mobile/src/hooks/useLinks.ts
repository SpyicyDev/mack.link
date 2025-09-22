import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linkAPI, Link, CreateLinkData } from '../services/api';

// Query keys
export const linkKeys = {
  all: ['links'],
  lists: () => [...linkKeys.all, 'list'],
  list: (filters?: Record<string, unknown>) => [...linkKeys.lists(), { filters }],
  details: () => [...linkKeys.all, 'detail'],
  detail: (id: string) => [...linkKeys.details(), id],
};

// Hook to fetch all links
export function useLinks(options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: linkKeys.lists(),
    queryFn: async (): Promise<Record<string, Link>> => {
      // Use paginated endpoint and merge pages client-side for now
      let cursor: string | undefined;
      const links: Record<string, Link> = {};
      do {
        const page = await linkAPI.listLinks(500, cursor);
        const pageLinks = page.links || page;
        Object.assign(links, pageLinks);
        cursor = page.cursor;
      } while (cursor);
      return links;
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

// Hook to fetch a single link
export function useLink(shortcode: string) {
  return useQuery({
    queryKey: linkKeys.detail(shortcode),
    queryFn: () => linkAPI.getLink(shortcode),
    enabled: !!shortcode,
  });
}

// Hook to create a new link
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLinkData) => linkAPI.createLink(data),

    onMutate: async (newLink: CreateLinkData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      // Snapshot the previous value
      const previousLinks = queryClient.getQueryData(linkKeys.lists());

      // Optimistically update to the new value
      if (previousLinks && newLink.shortcode) {
        queryClient.setQueryData(linkKeys.lists(), (old: Record<string, Link> | undefined) => ({
          ...old,
          [newLink.shortcode!]: {
            ...newLink,
            tags: newLink.tags || [],
            archived: false,
            activatesAt: newLink.activatesAt || '',
            expiresAt: newLink.expiresAt || '',
            passwordEnabled: !!(newLink.password && newLink.password.trim()),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            clicks: 0,
          },
        }));
      }

      return { previousLinks };
    },

    onError: (err, newLink, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(linkKeys.lists(), context.previousLinks);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}

// Hook to update a link
export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shortcode, data }: { shortcode: string; data: Partial<CreateLinkData> }) =>
      linkAPI.updateLink(shortcode, data),

    onSuccess: (updatedLink, { shortcode }) => {
      // Update the links list
      queryClient.setQueryData(linkKeys.lists(), (old: Record<string, Link> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          [shortcode]: updatedLink,
        };
      });

      // Update the individual link
      queryClient.setQueryData(linkKeys.detail(shortcode), updatedLink);
    },

    onSettled: (_, __, { shortcode }) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(shortcode) });
    },
  });
}

// Hook to delete a link
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shortcode: string) => linkAPI.deleteLink(shortcode),

    onSuccess: (_, shortcode) => {
      // Remove from links list
      queryClient.setQueryData(linkKeys.lists(), (old: Record<string, Link> | undefined) => {
        if (!old) return old;
        const newLinks = { ...old };
        delete newLinks[shortcode];
        return newLinks;
      });

      // Remove individual link cache
      queryClient.removeQueries({ queryKey: linkKeys.detail(shortcode) });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}

// Hook to bulk delete links
export function useBulkDeleteLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shortcodes: string[]) => linkAPI.bulkDeleteLinks(shortcodes),

    onSuccess: (_, shortcodes) => {
      // Remove from links list
      queryClient.setQueryData(linkKeys.lists(), (old: Record<string, Link> | undefined) => {
        if (!old) return old;
        const newLinks = { ...old };
        shortcodes.forEach((shortcode) => {
          delete newLinks[shortcode];
        });
        return newLinks;
      });

      // Remove individual link caches
      shortcodes.forEach((shortcode) => {
        queryClient.removeQueries({ queryKey: linkKeys.detail(shortcode) });
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}