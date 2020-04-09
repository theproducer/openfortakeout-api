exports.up = function (knex) {
    return knex.schema.createTable('corrections', (table) => {
        table.increments();
        table.integer('business_id').notNullable();
        table.string('type').nullable();
        table.specificType('tags', 'text[]').nullable();
        table.string('phone').nullable();
        table.text('details').nullable();
        table.string('hours').nullable();
        table.string('url').nullable();
        table.string('donateurl').nullable();
        table.boolean('giftcard');
        table.boolean('takeout');
        table.boolean('delivery');
        table.boolean('closed');
        table.boolean('approved');
        table.text('notes').nullable();
        table.timestamp('created_at', { useTz: false }).notNullable();
        table.timestamp('updated_at', { useTz: false }).notNullable();
        table.timestamp('deleted_at', { useTz: false }).nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('corrections');
};
