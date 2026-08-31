import type { InferRequestType, InferResponseType } from 'hono/client';
import type { ApiClient } from './client';

export type AuthUser = InferResponseType<ApiClient['auth']['login']['$post'], 200>['user'];
export type LoginResponse = InferResponseType<ApiClient['auth']['login']['$post'], 200>;
export type RegisteredUser = InferResponseType<ApiClient['auth']['register']['$post'], 201>;
export type User = InferResponseType<ApiClient['users']['$get'], 200>[number];
export type Workspace = InferResponseType<ApiClient['workspaces']['$get'], 200>[number];
export type Booking = InferResponseType<ApiClient['bookings']['$get'], 200>[number];
export type CreatedBooking = InferResponseType<ApiClient['bookings']['$post'], 201>;
export type AnalyticsOverview = InferResponseType<ApiClient['analytics']['overview']['$get'], 200>;
export type WorkspaceStat = InferResponseType<
	ApiClient['analytics']['workspaces']['$get'],
	200
>[number];
export type AuditLog = InferResponseType<ApiClient['audit']['$get'], 200>[number];
export type CreateUserInput = InferRequestType<ApiClient['users']['$post']>['json'];
export type CreateWorkspaceInput = InferRequestType<ApiClient['workspaces']['$post']>['json'];
export type UpdateWorkspaceInput = InferRequestType<
	ApiClient['workspaces'][':id']['$patch']
>['json'];
export type CreateBookingInput = InferRequestType<ApiClient['bookings']['$post']>['json'];
