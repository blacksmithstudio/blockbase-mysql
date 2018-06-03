const _ = require('underscore')
const mysql = require('mysql')

/**
 * Blockbase mysql driver (app.drivers.mysql)
 * @memberof app.drivers
 * @author Backsmith <code@blacksmith.studio>
 * @param {Object} app - Application namespace
 *
 * @returns {Object} driver object containing public methods
 */
module.exports = (app) => {
    const Logger = app.drivers.logger

    if (!app.config.has('mysql'))
        return Logger.error('Drivers', 'Can not init mysql, no valid config')

    const config = app.config.get('mysql')
    const pool = new mysql.createPool({
        user: config.user,
        database: config.database,
        password: config.password,
        host: config.host,
        port: config.port,
        max: 1000,
    })

    /**
     * Query function, executing the SQL query
     * @private
     * @name query
     * @param {string} sql - sql query (prepared or not)
     * @param {Object[]} data - array of data to pass in the prepared query
     */
    async function query(sql, data) {
        return new Promise((resolve, reject) => {
            pool.getConnection((error, connection) => {
                if (error) {
                    Logger.error('Drivers - mysql', error)
                    return reject(error)
                }

                connection.query(sql, data, (error, results) => {
                    if (error) return reject(error)
                    resolve(results)
                })
            })
        })
    }

    /**
     * Preparation of the values (transformation)
     * @private
     * @param {Object[]} values - array of data to prepare
     *
     * @returns {Object[]} array of transformed data
     */
    function prepare(values) {
        return _.map(values, (val) => {
            switch (typeof val) {
                case 'object':
                    val = JSON.stringify(val)
                    break
                default:
                    break
            }

            return val
        })
    }

    return {
        /**
         * Execute a custom query
         * @alias query
         */
        execute: query,

        /**
         * Create an object based on a Blocbase valid model
         * @param {Object} item - object compiled by the model
         * @return {Promise<Object>} saved item
         */
        async save(item) {
            if (!item.valid()) throw Error(item.validate().error)

            try {
                let columns = [], values = []
                for ([key, value] of Object.entries(item.body())) {
                    columns.push(key)
                    values.push(value)
                }

                let q = `INSERT INTO ${item.params.table || (item.params.type + 's')} (${columns.join(',')}) VALUES ('${values.join(',')}') `
                let result = await query(q, prepare(values))
                item.body({id: result.insertId})
                return await item.read(item)
            } catch (e) {
                throw e
            }
        },

        /**
         * Read an object from the DB
         * @param {Object} item - object compiled by the model (needs id)
         * @return {Promise<Object>} called item
         */
        async read(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot read an item without an 'id'`)

            let q = `SELECT * FROM ${item.params.table || (item.params.type + 's')} WHERE id=?`

            try {

                let rows = await query(q, [item.data.id])
                if (rows.length)
                    item.body(rows[0])
                return rows.length ? item : null

            } catch (e) {
                throw e
            }
        },

        /**
         * Update a valid object model
         * @param {Object} item - object compiled by the model
         * @return {Promise<Object>} updated item
         */
        async update(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot update an item without an 'id'`)

            let updates = [], values = []
            for ([key, value] of Object.entries(item.body())) {
                updates.push(`${key}=?`)
                values.push(value)
            }
            values.push(item.data.id)

            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${updates.join(' , ')} WHERE id=? `

            try {
                await query(q, prepare(values))

                let rows = this.read(item)
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        },

        /**
         * Delete a valid object model
         * @param {Object} item - object compiled by the model
         * @returns {Promise<boolean>} - true if deleted
         */
        async delete(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot delete an item without an 'id'`)

            let q = `DELETE FROM ${item.params.table || (item.params.type + 's')} WHERE id=?`

            try {
                let result = await query(q, [item.data.id])
                return result.affectedRows > 0
            } catch (e) {
                throw e
            }
        },

        /**
         * Append a value to a pSQL Array
         * @deprecated further developement needed
         * @param {object} item - user item
         * @param {number} target - target id
         * @param {string} column - target column (array)
         * @param {*} value - value to insert
         * @returns {Promise<Object>} - updated item
         */
        async array_append(item, target, column, value) {
            let updates = [], values = []
            for ([key, value] of Object.entries(item.body())) {
                updates.push(`${key}=?`)
                values.push(value)
            }
            values.push(item.data.id)

            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${column}=array_append(${column}, $1) where id=$2 and $1 <> all (${column}) RETURNING *`

            try {
                let rows = await query(q, [value, target])
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        },

        /**
         * Remove a value from a pSQL Array
         * @deprecated further developement needed
         * @param {string} item - user item
         * @param {number} target - target id
         * @param {string} column - target column (array)
         * @param {*} value - value to insert
         * @returns {Promise<Object>} - updated item
         */
        async array_remove(item, target, column, value) {
            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${column}=array_remove(${column}, $1) where id=$2 RETURNING *`

            try {
                let rows = await query(q, [value, target])
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        }
    }
}
