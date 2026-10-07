<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Esquema base heredado del sitio Next.js (gaiacapoeira.com).
 *
 * La base de producción YA tiene estas 13 tablas con datos reales: fueron
 * creadas por drizzle-kit en la versión anterior del sitio. Esta migración
 * las describe tal cual están (tipos, defaults, índices y FKs) para que una
 * base nueva —la de tests, una instalación local desde cero— quede idéntica.
 *
 * Sobre una base que ya las tiene no hace nada: cada tabla se crea solo si no
 * existe. Por eso es seguro correr `php artisan migrate` contra producción.
 *
 * Política de FKs en user_id (heredada, ver CLAUDE.md):
 *  - contenido curado (rodas, songs, articles, movements, portuguese_lessons,
 *    page_views): nullable + ON DELETE SET NULL.
 *  - datos propios del usuario (comments, favorites, user_lesson_progress):
 *    NOT NULL + ON DELETE CASCADE.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->createIfMissing('usuarios', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('username')->unique('usuarios_username_unique');
            $table->string('password_hash');
            $table->string('name');
            $table->string('email')->nullable();
            $table->enum('role', ['admin', 'member'])->default('member');
            $table->string('apodo')->nullable();
            $table->text('avatar')->nullable();
            $this->timestamps($table);
        });

        $this->createIfMissing('cantorias', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->text('video_url')->nullable();
            $table->text('description')->nullable();
            $table->date('event_date')->nullable();
            $this->timestamps($table);
        });

        $this->createIfMissing('politica', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('category')->nullable();
            $table->text('file_url')->nullable();
            $table->string('file_name')->nullable();
            $this->timestamps($table);
        });

        $this->createIfMissing('rodas', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('video_url');
            $table->text('thumbnail_url')->nullable();
            $table->string('location')->nullable();
            $table->date('event_date')->nullable();
            $table->integer('duration')->nullable();
            $table->json('participants')->nullable();
            $table->json('tags')->nullable();
            $table->integer('views')->default(0);
            $this->curatedUserId($table, 'rodas');
            $this->timestamps($table);
        });

        $this->createIfMissing('songs', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->string('type', 100);
            $table->text('lyrics');
            $table->text('translation')->nullable();
            $table->text('context')->nullable();
            $table->text('video_url')->nullable();
            $table->text('audio_url')->nullable();
            $table->string('mestre')->nullable();
            $table->json('tags')->nullable();
            $this->curatedUserId($table, 'songs');
            $this->timestamps($table);
            // Canción propia del grupo o de un integrante (filtro "Nossas").
            $table->boolean('nossa')->default(false);
        });

        $this->createIfMissing('page_views', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('path', 500);
            $this->curatedUserId($table, 'page_views');
            $table->dateTime('created_at')->useCurrent();
            $table->index('path', 'page_views_path_idx');
            $table->index('created_at', 'page_views_created_at_idx');
        });

        // ── Tablas sin uso todavía en el código (módulos futuros) ──────────

        $this->createIfMissing('articles', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->string('slug')->unique('articles_slug_unique');
            $table->text('excerpt')->nullable();
            $table->text('content');
            $table->text('cover_image_url')->nullable();
            $table->string('category');
            $table->json('tags')->nullable();
            $table->boolean('published')->default(false);
            $this->curatedUserId($table, 'articles');
            $this->timestamps($table);
        });

        $this->createIfMissing('movements', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('name');
            $table->string('portuguese_name')->nullable();
            $table->text('description')->nullable();
            $table->text('video_url')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->string('category');
            $table->string('difficulty', 100);
            $table->json('tips')->nullable();
            $table->json('related_movements')->nullable();
            $this->curatedUserId($table, 'movements');
            $this->timestamps($table);
        });

        $this->createIfMissing('portuguese_lessons', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('content');
            $table->string('level', 100);
            $table->string('category');
            $table->integer('order_index')->default(0);
            $this->curatedUserId($table, 'portuguese_lessons');
            $this->timestamps($table);
        });

        $this->createIfMissing('portuguese_vocabulary', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('lesson_id', 36)->nullable();
            $table->string('word');
            $table->string('translation');
            $table->string('pronunciation')->nullable();
            $table->text('example_sentence')->nullable();
            $table->text('example_translation')->nullable();
            $table->text('audio_url')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->foreign('lesson_id', 'portuguese_vocabulary_lesson_id_portuguese_lessons_id_fk')
                ->references('id')->on('portuguese_lessons')->cascadeOnDelete()->noActionOnUpdate();
        });

        $this->createIfMissing('comments', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->text('content');
            $this->ownedUserId($table, 'comments');
            $this->optionalParent($table, 'comments', 'roda_id', 'rodas');
            $this->optionalParent($table, 'comments', 'article_id', 'articles');
            $this->optionalParent($table, 'comments', 'song_id', 'songs');
            $this->timestamps($table);
        });

        $this->createIfMissing('favorites', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $this->ownedUserId($table, 'favorites');
            $this->optionalParent($table, 'favorites', 'roda_id', 'rodas');
            $this->optionalParent($table, 'favorites', 'movement_id', 'movements');
            $this->optionalParent($table, 'favorites', 'article_id', 'articles');
            $this->optionalParent($table, 'favorites', 'song_id', 'songs');
            $table->dateTime('created_at')->useCurrent();
        });

        $this->createIfMissing('user_lesson_progress', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $this->ownedUserId($table, 'user_lesson_progress');
            $table->char('lesson_id', 36);
            $table->boolean('completed')->default(false);
            $table->integer('score')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->foreign('lesson_id', 'user_lesson_progress_lesson_id_portuguese_lessons_id_fk')
                ->references('id')->on('portuguese_lessons')->cascadeOnDelete()->noActionOnUpdate();
        });
    }

    /**
     * Intencionalmente vacío: estas tablas tienen datos reales de producción
     * que no fueron creados por esta migración. Un rollback nunca debe
     * borrarlas. Para una base descartable (tests) se usa `migrate:fresh`,
     * que no pasa por down().
     */
    public function down(): void {}

    private function createIfMissing(string $name, Closure $definition): void
    {
        if (! Schema::hasTable($name)) {
            Schema::create($name, $definition);
        }
    }

    /** created_at / updated_at como los dejó drizzle: DATETIME con default. */
    private function timestamps(Blueprint $table): void
    {
        $table->dateTime('created_at')->useCurrent();
        $table->dateTime('updated_at')->useCurrent();
    }

    /** Contenido curado: sobrevive al borrado del usuario que lo creó. */
    private function curatedUserId(Blueprint $table, string $tableName): void
    {
        $table->char('user_id', 36)->nullable();
        $table->foreign('user_id', "{$tableName}_user_id_usuarios_id_fk")
            ->references('id')->on('usuarios')->nullOnDelete()->noActionOnUpdate();
    }

    /** Datos propios del usuario: se borran con él. */
    private function ownedUserId(Blueprint $table, string $tableName): void
    {
        $table->char('user_id', 36);
        $table->foreign('user_id', "{$tableName}_user_id_usuarios_id_fk")
            ->references('id')->on('usuarios')->cascadeOnDelete()->noActionOnUpdate();
    }

    private function optionalParent(Blueprint $table, string $tableName, string $column, string $parent): void
    {
        $table->char($column, 36)->nullable();
        $table->foreign($column, "{$tableName}_{$column}_{$parent}_id_fk")
            ->references('id')->on($parent)->cascadeOnDelete()->noActionOnUpdate();
    }
};
