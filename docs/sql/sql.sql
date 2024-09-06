CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL,
    "created" DATE NOT NULL DEFAULT now(),
    "modified" DATE DEFAULT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sleeps" (
    "id" SERIAL,
    "user_id" INTEGER NOT NULL,
    "created" DATE NOT NULL DEFAULT now(),
    "modified" DATE NOT NULL,
    "date" DATE NOT NULL,
    "sleep_time" INT NOT NULL,
    "sleep_start" DATE NOT NULL,
    "sleep_end" DATE NOT NULL,
    "wake_up_humor" JSON NOT NULL DEFAULT "",
    "lay_down_humor" JSON NOT NULL DEFAULT "",
    "biological_occurences" JSON NOT NULL DEFAULT "",
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "dream_point_of_view" (
    "id" SERIAL,
    "description" VARCHAR NOT NULL,
    PRIMARY KEY ("id"),
);

INSERT INTO "dream_point_of_view" VALUES
(1),
(2),
(3);

CREATE TABLE IF NOT EXISTS "dream_hour" (
    "id" SERIAL,
    "description" VARCHAR NOT NULL,
    PRIMARY KEY ("id")
);

INSERT INTO "dream_hour" VALUES
("Amanhecer"),
("Dia"),
("Anoitecer"),
("Noite"),
("Indefinido"),
("Múltiplos");

CREATE TABLE IF NOT EXISTS "dream_duration" (
    "id" SERIAL,
    "description" VARCHAR NOT NULL,
    PRIMARY KEY ("id")
);

INSERT INTO "dream_duration" VALUES
("Instantâneo"),
("Curto"),
("Médio"),
("Longo");

CREATE TABLE IF NOT EXISTS "dream_lucidity_level" (
    "id" SERIAL,
    "description" VARCHAR NOT NULL,
    PRIMARY KEY ("id")
);

INSERT INTO "dream_lucidity_level" VALUES
("Não lúcido"),
("Parcialmente lúcido"),
("Lúcido"),
("Indefinido");

CREATE TABLE IF NOT EXISTS "dream_type" (
    "id" SERIAL,
    "description" VARCHAR NOT NULL,
    PRIMARY KEY ("id")
);

INSERT INTO "dream_type" VALUES
("Sonho"),
("Pesadelo"),
("Indefinido");

CREATE TABLE IF NOT EXISTS "dream_reality_level" (
    "id" SERIAL,
    "description" VARCHAR NOT NULL,
    PRIMARY KEY ("id")
);

INSERT INTO "dream_reality_level" VALUES
("Irreal"),
("Parcialmente real"),
("Real");

CREATE TABLE IF NOT EXISTS "dreams" (
    id SERIAL,
    created DATE NOT NULL DEFAULT now(),
    modified DATE NOT NULL DEFAULT NULL,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    point_of_view_id INT NOT NULL,
    climate JSON NOT NULL DEFAULT "",
    hour_id NOT NULL,
    duration_id NOT NULL,
    lucidity_level_id NOT NULL,
    dream_type_id NOT NULL,
    reality_level_id NOT NULL,
    erotic_dream BOOLEAN NOT NULL DEFAULT false,
    hidden_dream BOOLEAN NOT NULL DEFAULT false,
    personal_analysis VARCHAR,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("point_of_view_id") REFERENCES "dream_point_of_view" ("id"),
    FOREIGN KEY ("hour_id") REFERENCES "dream_hour_id" ("id"),
    FOREIGN KEY ("duration_id") REFERENCES "dream_duration_id" ("id"),
    FOREIGN KEY ("lucidity_level_id") REFERENCES "dream_lucidity_level_id" ("id"),
    FOREIGN KEY ("dream_type_id") REFERENCES "dream_type_id" ("id"),
    FOREIGN KEY ("reality_level_id") REFERENCES "dream_reality_level_id" ("id")
);

CREATE TABLE IF NOT EXISTS "tags" (
    "id" SERIAL,
    "title" VARCHAR NOT NULL,
    "created" DATE NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "dream_tag" (
    "id" SERIAL,
    "dream_id" INT NOT NULL,
    "tag_id" INT NOT NULL,
    "created" DATE NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("dream_id") REFERENCES "dreams" ("id"),
    FOREIGN KEY ("tag_id") REFERENCES "tags" ("id")
);