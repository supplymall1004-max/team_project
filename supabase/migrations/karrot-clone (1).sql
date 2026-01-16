DROP TABLE IF EXISTS `chat_messages`;

CREATE TABLE `chat_messages` (
	`id`	bigint	NOT NULL,
	`chat_room_id`	bigint	NOT NULL,
	`sender_id`	bigint	NULL,
	`message`	varchar(500)	NOT NULL,
	`read_or_not`	bool	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
	`id`	bigint	NOT NULL,
	`role`	enum	NOT NULL	COMMENT 'GIN IDX',
	`mobile_number`	varchar(11)	NOT NULL	COMMENT 'UNQUE',
	`activated`	bool	NOT NULL,
	`rating_score`	numeric(3,1)	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `evaluation_items`;

CREATE TABLE `evaluation_items` (
	`id`	int4	NOT NULL,
	`score`	numeric(3, 1)	NOT NULL,
	`text`	varchar(20)	NOT NULL
);

DROP TABLE IF EXISTS `follow_users`;

CREATE TABLE `follow_users` (
	`user_id`	bigint	NOT NULL,
	`target_id`	bigint	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
	`id`	int4	NOT NULL,
	`name`	varchar(20)	NOT NULL
);

DROP TABLE IF EXISTS `files`;

CREATE TABLE `files` (
	`id`	bigint	NOT NULL,
	`uploader_id`	bigint	NOT NULL,
	`type`	varchar(50)	NOT NULL,
	`name`	varchar(255)	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `emd_areas`;

CREATE TABLE `emd_areas` (
	`id`	int4	NOT NULL,
	`sigg_area_id`	int4	NOT NULL,
	`adm_code`	varchar(10)	NOT NULL	COMMENT 'BTREE IDX',
	`name`	varchar(50)	NOT NULL	COMMENT 'GIN IDX',
	`geom`	geometry(MultiPolygon,4326)	NOT NULL,
	`location`	geometry(Point,4326)	NOT NULL,
	`version`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `goods`;

CREATE TABLE `goods` (
	`id`	bigint	NOT NULL,
	`seller_id`	bigint	NOT NULL	COMMENT 'BTREE IDX',
	`selling_area_id`	int4	NOT NULL	COMMENT 'GIN IDX',
	`category_id`	int4	NOT NULL	COMMENT 'GIN IDX',
	`title`	varchar(100)	NOT NULL	COMMENT 'GIN IDX (TRIGRAM)',
	`status`	enum	NOT NULL,
	`sell_price`	int4	NULL,
	`view_count`	int4	NOT NULL,
	`description`	text	NOT NULL,
	`refreshed_at`	timestamp	NOT NULL	COMMENT 'GIN IDX',
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `block_users`;

CREATE TABLE `block_users` (
	`user_id`	bigint	NOT NULL,
	`target_id`	bigint	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `sido_areas`;

CREATE TABLE `sido_areas` (
	`id`	int4	NOT NULL,
	`adm_code`	varchar(2)	NOT NULL	COMMENT 'BTREE IDX',
	`name`	varchar(50)	NOT NULL	COMMENT 'GIN IDX',
	`version`	varchar(20)	NOT NULL
);

DROP TABLE IF EXISTS `goods_images`;

CREATE TABLE `goods_images` (
	`goods_id`	bigint	NOT NULL,
	`file_id`	bigint	NOT NULL
);

DROP TABLE IF EXISTS `transaction_reviews`;

CREATE TABLE `transaction_reviews` (
	`id`	bigint	NOT NULL,
	`author_id`	bigint	NOT NULL,
	`goods_id`	bigint	NOT NULL,
	`message`	varchar(255)	NOT NULL,
	`evaluation_items`	int4[]	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `notification_keywords`;

CREATE TABLE `notification_keywords` (
	`id`	bigint	NOT NULL,
	`register_id`	bigint	NOT NULL,
	`keyword`	varchar(10)	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `sigg_areas`;

CREATE TABLE `sigg_areas` (
	`id`	int4	NOT NULL,
	`sido_area_id`	int4	NOT NULL,
	`adm_code`	varchar(5)	NOT NULL	COMMENT 'BTREE IDX',
	`name`	varchar(50)	NOT NULL,
	`version`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
	`id`	bigint	NOT NULL,
	`receiver_id`	bigint	NOT NULL,
	`message`	varchar(255)	NOT NULL,
	`read_or_not`	bool	NOT NULL,
	`type`	enum	NOT NULL,
	`reference_id`	bigint	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `price_offers`;

CREATE TABLE `price_offers` (
	`id`	bigint	NOT NULL,
	`offerer_id`	bigint	NOT NULL,
	`goods_id`	bigint	NOT NULL,
	`offered_price`	int4	NOT NULL,
	`accept_or_not`	bool	NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `chat_room`;

CREATE TABLE `chat_room` (
	`id`	bigint	NOT NULL,
	`goods_id`	bigint	NOT NULL,
	`buyer_id`	bigint	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `wish_lists`;

CREATE TABLE `wish_lists` (
	`id`	bigint	NOT NULL,
	`register_id`	bigint	NOT NULL,
	`goods_id`	bigint	NOT NULL,
	`created_at`	timestamp	NOT NULL
);

DROP TABLE IF EXISTS `activity_areas`;

CREATE TABLE `activity_areas` (
	`user_id`	bigint	NOT NULL,
	`reference_area_id`	int4	NOT NULL,
	`distance_meters`	int2	NOT NULL,
	`emd_area_ids`	int4[]	NOT NULL	COMMENT 'GIN IDX',
	`authenticated_at`	timestamp	NULL
);

ALTER TABLE `chat_messages` ADD CONSTRAINT `PK_CHAT_MESSAGES` PRIMARY KEY (
	`id`
);

ALTER TABLE `users` ADD CONSTRAINT `PK_USERS` PRIMARY KEY (
	`id`
);

ALTER TABLE `evaluation_items` ADD CONSTRAINT `PK_EVALUATION_ITEMS` PRIMARY KEY (
	`id`
);

ALTER TABLE `follow_users` ADD CONSTRAINT `PK_FOLLOW_USERS` PRIMARY KEY (
	`user_id`,
	`target_id`
);

ALTER TABLE `categories` ADD CONSTRAINT `PK_CATEGORIES` PRIMARY KEY (
	`id`
);

ALTER TABLE `files` ADD CONSTRAINT `PK_FILES` PRIMARY KEY (
	`id`
);

ALTER TABLE `emd_areas` ADD CONSTRAINT `PK_EMD_AREAS` PRIMARY KEY (
	`id`
);

ALTER TABLE `goods` ADD CONSTRAINT `PK_GOODS` PRIMARY KEY (
	`id`
);

ALTER TABLE `block_users` ADD CONSTRAINT `PK_BLOCK_USERS` PRIMARY KEY (
	`user_id`,
	`target_id`
);

ALTER TABLE `sido_areas` ADD CONSTRAINT `PK_SIDO_AREAS` PRIMARY KEY (
	`id`
);

ALTER TABLE `goods_images` ADD CONSTRAINT `PK_GOODS_IMAGES` PRIMARY KEY (
	`goods_id`,
	`file_id`
);

ALTER TABLE `transaction_reviews` ADD CONSTRAINT `PK_TRANSACTION_REVIEWS` PRIMARY KEY (
	`id`
);

ALTER TABLE `notification_keywords` ADD CONSTRAINT `PK_NOTIFICATION_KEYWORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `sigg_areas` ADD CONSTRAINT `PK_SIGG_AREAS` PRIMARY KEY (
	`id`
);

ALTER TABLE `notifications` ADD CONSTRAINT `PK_NOTIFICATIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `price_offers` ADD CONSTRAINT `PK_PRICE_OFFERS` PRIMARY KEY (
	`id`
);

ALTER TABLE `chat_room` ADD CONSTRAINT `PK_CHAT_ROOM` PRIMARY KEY (
	`id`
);

ALTER TABLE `wish_lists` ADD CONSTRAINT `PK_WISH_LISTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `activity_areas` ADD CONSTRAINT `PK_ACTIVITY_AREAS` PRIMARY KEY (
	`user_id`,
	`reference_area_id`
);

ALTER TABLE `chat_messages` ADD CONSTRAINT `FK_chat_room_TO_chat_messages_1` FOREIGN KEY (
	`chat_room_id`
)
REFERENCES `chat_room` (
	`id`
);

ALTER TABLE `chat_messages` ADD CONSTRAINT `FK_users_TO_chat_messages_1` FOREIGN KEY (
	`sender_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `follow_users` ADD CONSTRAINT `FK_users_TO_follow_users_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `follow_users` ADD CONSTRAINT `FK_users_TO_follow_users_2` FOREIGN KEY (
	`target_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `files` ADD CONSTRAINT `FK_users_TO_files_1` FOREIGN KEY (
	`uploader_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `emd_areas` ADD CONSTRAINT `FK_sigg_areas_TO_emd_areas_1` FOREIGN KEY (
	`sigg_area_id`
)
REFERENCES `sigg_areas` (
	`id`
);

ALTER TABLE `goods` ADD CONSTRAINT `FK_users_TO_goods_1` FOREIGN KEY (
	`seller_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `goods` ADD CONSTRAINT `FK_emd_areas_TO_goods_1` FOREIGN KEY (
	`selling_area_id`
)
REFERENCES `emd_areas` (
	`adm_code`
);

ALTER TABLE `goods` ADD CONSTRAINT `FK_categories_TO_goods_1` FOREIGN KEY (
	`category_id`
)
REFERENCES `categories` (
	`id`
);

ALTER TABLE `block_users` ADD CONSTRAINT `FK_users_TO_block_users_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `block_users` ADD CONSTRAINT `FK_users_TO_block_users_2` FOREIGN KEY (
	`target_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `goods_images` ADD CONSTRAINT `FK_goods_TO_goods_images_1` FOREIGN KEY (
	`goods_id`
)
REFERENCES `goods` (
	`id`
);

ALTER TABLE `goods_images` ADD CONSTRAINT `FK_files_TO_goods_images_1` FOREIGN KEY (
	`file_id`
)
REFERENCES `files` (
	`id`
);

ALTER TABLE `transaction_reviews` ADD CONSTRAINT `FK_users_TO_transaction_reviews_1` FOREIGN KEY (
	`author_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `transaction_reviews` ADD CONSTRAINT `FK_goods_TO_transaction_reviews_1` FOREIGN KEY (
	`goods_id`
)
REFERENCES `goods` (
	`id`
);

ALTER TABLE `notification_keywords` ADD CONSTRAINT `FK_users_TO_notification_keywords_1` FOREIGN KEY (
	`register_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `sigg_areas` ADD CONSTRAINT `FK_sido_areas_TO_sigg_areas_1` FOREIGN KEY (
	`sido_area_id`
)
REFERENCES `sido_areas` (
	`id`
);

ALTER TABLE `notifications` ADD CONSTRAINT `FK_users_TO_notifications_1` FOREIGN KEY (
	`receiver_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `price_offers` ADD CONSTRAINT `FK_users_TO_price_offers_1` FOREIGN KEY (
	`offerer_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `price_offers` ADD CONSTRAINT `FK_goods_TO_price_offers_1` FOREIGN KEY (
	`goods_id`
)
REFERENCES `goods` (
	`id`
);

ALTER TABLE `chat_room` ADD CONSTRAINT `FK_goods_TO_chat_room_1` FOREIGN KEY (
	`goods_id`
)
REFERENCES `goods` (
	`id`
);

ALTER TABLE `chat_room` ADD CONSTRAINT `FK_users_TO_chat_room_1` FOREIGN KEY (
	`buyer_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `wish_lists` ADD CONSTRAINT `FK_users_TO_wish_lists_1` FOREIGN KEY (
	`register_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `wish_lists` ADD CONSTRAINT `FK_goods_TO_wish_lists_1` FOREIGN KEY (
	`goods_id`
)
REFERENCES `goods` (
	`id`
);

ALTER TABLE `activity_areas` ADD CONSTRAINT `FK_users_TO_activity_areas_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `activity_areas` ADD CONSTRAINT `FK_emd_areas_TO_activity_areas_1` FOREIGN KEY (
	`reference_area_id`
)
REFERENCES `emd_areas` (
	`id`
);

