/**
 * Khuôn UUID v4 dùng chung — R1.4 (redesign 2C).
 *
 * Trước đây hằng số này được chép tay ở 8 nơi (page/route/directory); một bản
 * gõ lệch là một đường 500 thay vì 404 cho UUID sai định dạng (AGENTS §5).
 * Mọi chỗ cần kiểm UUID từ URL/searchParams import từ đây.
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
