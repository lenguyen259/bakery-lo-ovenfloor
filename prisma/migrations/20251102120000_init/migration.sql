-- CreateSchema
CREATE TABLE "outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    CONSTRAINT "outlet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sku" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "batch_multiple" INTEGER NOT NULL,
    "baked" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "sku_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingredient" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "ingredient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingredient_on_hand" (
    "ingredient_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "as_of" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "ingredient_on_hand_pkey" PRIMARY KEY ("ingredient_id")
);

CREATE TABLE "recipe" (
    "id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "yield_units" INTEGER NOT NULL,
    CONSTRAINT "recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recipe_line" (
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "qty_per_yield" INTEGER NOT NULL,
    CONSTRAINT "recipe_line_pkey" PRIMARY KEY ("recipe_id","ingredient_id")
);

CREATE TABLE "oven" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decks" INTEGER NOT NULL,
    "bakes_per_day" INTEGER NOT NULL,
    CONSTRAINT "oven_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "demand_signal" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "for_date" DATE NOT NULL,
    "qty" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "captured_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "demand_signal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finished_on_hand" (
    "outlet_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "as_of" DATE NOT NULL,
    CONSTRAINT "finished_on_hand_pkey" PRIMARY KEY ("outlet_id","sku_id","as_of")
);

CREATE TABLE "yield_observation" (
    "sku_id" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "produced_qty" INTEGER NOT NULL,
    "waste_qty" INTEGER NOT NULL,
    CONSTRAINT "yield_observation_pkey" PRIMARY KEY ("sku_id","event_date")
);

CREATE TABLE "waste_event" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "recorded_by" TEXT NOT NULL,
    CONSTRAINT "waste_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batch_plan" (
    "id" TEXT NOT NULL,
    "for_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "narrative_en" TEXT,
    "narrative_vi" TEXT,
    "failure_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT NOT NULL,
    "released_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batch_line" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "demand_qty" INTEGER NOT NULL,
    "excluded_stale_qty" INTEGER NOT NULL DEFAULT 0,
    "leftover_qty" INTEGER NOT NULL,
    "waste_buffer_qty" INTEGER NOT NULL,
    "planned_qty" INTEGER NOT NULL,
    "slots" INTEGER NOT NULL,
    "constrained_by" TEXT,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "batch_line_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "process_step" (
    "id" TEXT NOT NULL,
    "stream" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "owner_role" TEXT NOT NULL,
    "input_en" TEXT NOT NULL,
    "output_en" TEXT NOT NULL,
    "system_name" TEXT NOT NULL,
    "pain_en" TEXT NOT NULL,
    "pain_vi" TEXT NOT NULL,
    CONSTRAINT "process_step_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "requirement" (
    "id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "statement_en" TEXT NOT NULL,
    "statement_vi" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "acceptance_en" TEXT NOT NULL,
    CONSTRAINT "requirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_run" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "question" TEXT,
    "input_json" JSONB NOT NULL,
    "output_json" JSONB NOT NULL,
    "failure_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ingredient_on_hand" ADD CONSTRAINT "ingredient_on_hand_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_line" ADD CONSTRAINT "recipe_line_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_line" ADD CONSTRAINT "recipe_line_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demand_signal" ADD CONSTRAINT "demand_signal_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demand_signal" ADD CONSTRAINT "demand_signal_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finished_on_hand" ADD CONSTRAINT "finished_on_hand_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finished_on_hand" ADD CONSTRAINT "finished_on_hand_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "yield_observation" ADD CONSTRAINT "yield_observation_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "waste_event" ADD CONSTRAINT "waste_event_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "waste_event" ADD CONSTRAINT "waste_event_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "batch_line" ADD CONSTRAINT "batch_line_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "batch_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "batch_line" ADD CONSTRAINT "batch_line_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "process_step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "recipe_sku_id_key" ON "recipe"("sku_id");
