import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileAPI } from '../services/api'

export const profileKeys = {
  root: ['profile'],
  details: () => [...profileKeys.root, 'detail'],
  links: () => [...profileKeys.root, 'links'],
}

export function useProfile(options = {}) {
  return useQuery({
    queryKey: profileKeys.details(),
    queryFn: () => profileAPI.getProfile(),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates) => profileAPI.updateProfile(updates),
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.details(), data)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: profileKeys.details() })
    },
  })
}

export function useProfileLinks(options = {}) {
  return useQuery({
    queryKey: profileKeys.links(),
    queryFn: () => profileAPI.listLinks(),
    staleTime: 1000 * 30,
    ...options,
  })
}

export function useCreateProfileLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => profileAPI.createLink(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.links() })
    },
  })
}

export function useUpdateProfileLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) => profileAPI.updateLink(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.links() })
    },
  })
}

export function useDeleteProfileLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => profileAPI.deleteLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.links() })
    },
  })
}

export function useReorderProfileLinks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (order) => profileAPI.reorderLinks(order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.links() })
    },
  })
}

