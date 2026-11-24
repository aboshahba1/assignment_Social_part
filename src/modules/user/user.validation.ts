
import * as z from "zod";

export const followUserSchema = {
    params: z.object({
        id: z.string().min(1)
    })
};

export const unfollowUserSchema = {
    params: z.object({
        id: z.string().min(1)
    })
};

export const searchUsersSchema = {
    query: z.object({
        search: z.string().min(1)
    })
};

export const updatePrivacySchema = {
    body: z.object({
        isPrivate: z.boolean()
    })
};
