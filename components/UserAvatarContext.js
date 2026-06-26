'use client'
import { createContext, useContext } from 'react'

// Holds the current user's saved avatar URL.
// Provided at the top level in CommodityScreener so every component can read it.
export const UserAvatarContext = createContext(null)
export function useUserAvatar() { return useContext(UserAvatarContext) }
