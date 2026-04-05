import { getSupabaseClient } from '../lib/supabase'

const tableConfig = {
  department: {
    primaryKey: 'dept_id',
    orderBy: [{ column: 'dept_id', ascending: true }],
  },
  doctor: {
    primaryKey: 'doctor_id',
    orderBy: [{ column: 'doctor_id', ascending: true }],
  },
  patient: {
    primaryKey: 'patient_id',
    orderBy: [{ column: 'patient_id', ascending: true }],
  },
  appointment: {
    primaryKey: 'appointment_id',
    orderBy: [
      { column: 'appointment_date', ascending: false },
      { column: 'time_slot', ascending: true },
    ],
  },
  medical_record: {
    primaryKey: 'record_id',
    orderBy: [{ column: 'visit_date', ascending: false }],
  },
  lab_test: {
    primaryKey: 'test_id',
    orderBy: [{ column: 'order_date', ascending: false }],
  },
  prescription: {
    primaryKey: 'prescription_id',
    orderBy: [{ column: 'prescribed_date', ascending: false }],
  },
  bill: {
    primaryKey: 'bill_id',
    orderBy: [{ column: 'bill_date', ascending: false }],
  },
}

export const entityKeys = Object.keys(tableConfig)

export const emptyHospitalData = Object.fromEntries(entityKeys.map((key) => [key, []]))

function applyOrdering(query, orderBy) {
  return orderBy.reduce(
    (currentQuery, orderRule) =>
      currentQuery.order(orderRule.column, { ascending: orderRule.ascending }),
    query,
  )
}

function normalizeDateTimeValue(value) {
  if (!value) {
    return value
  }

  return value.length === 16 ? `${value}:00` : value
}

function normalizeTimeValue(value) {
  if (!value) {
    return value
  }

  return value.length === 5 ? `${value}:00` : value
}

function normalizeFormValue(field, rawValue) {
  if (rawValue == null) {
    return undefined
  }

  const trimmedValue = typeof rawValue === 'string' ? rawValue.trim() : rawValue

  if (trimmedValue === '') {
    return undefined
  }

  switch (field.type) {
    case 'number':
      return Number(trimmedValue)
    case 'datetime-local':
      return normalizeDateTimeValue(trimmedValue)
    case 'time':
      return normalizeTimeValue(trimmedValue)
    default:
      return trimmedValue
  }
}

function buildInsertPayload(tableName, fields, formValues) {
  const payload = fields.reduce((result, field) => {
    const normalizedValue = normalizeFormValue(field, formValues[field.name])

    if (normalizedValue !== undefined) {
      result[field.name] = normalizedValue
    }

    return result
  }, {})

  if (tableName === 'bill') {
    if (!('paid_amount' in payload) && 'total_amount' in payload) {
      payload.paid_amount = 0
    }

    if ('total_amount' in payload && 'paid_amount' in payload) {
      const totalAmount = Number(payload.total_amount)
      const paidAmount = Number(payload.paid_amount)

      if (!Number.isFinite(totalAmount) || !Number.isFinite(paidAmount)) {
        throw new Error('Total amount and paid amount must be valid numbers.')
      }

      if (paidAmount > totalAmount) {
        throw new Error('Paid amount cannot be greater than total amount.')
      }

      const balance = totalAmount - paidAmount

      if (balance <= 0) {
        payload.status = 'Paid'
      } else if (paidAmount > 0) {
        payload.status = 'Partially Paid'
      } else {
        payload.status = 'Pending'
      }
    }

    // Do NOT send balance, let the database compute it
    if ('balance' in payload) {
      delete payload.balance
    }
  }

  return payload
}

export function getTablePrimaryKey(tableName) {
  return tableConfig[tableName]?.primaryKey
}

export async function fetchHospitalData() {
  const supabase = getSupabaseClient()

  const entries = await Promise.all(
    entityKeys.map(async (tableName) => {
      const config = tableConfig[tableName]
      const query = applyOrdering(supabase.from(tableName).select('*'), config.orderBy)
      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to load ${tableName}: ${error.message}`)
      }

      return [tableName, data ?? []]
    }),
  )

  return Object.fromEntries(entries)
}

export async function insertHospitalRecord(tableName, fields, formValues) {
  const supabase = getSupabaseClient()
  const payload = buildInsertPayload(tableName, fields, formValues)
  const { data, error } = await supabase.from(tableName).insert(payload).select().single()

  if (error) {
    throw new Error(`Failed to create ${tableName}: ${error.message}`)
  }

  return data
}

const generatedColumns = {
  bill: ['balance'],
}

export async function updateHospitalRecord(tableName, primaryKeyValue, fields, formValues) {
  const supabase = getSupabaseClient()
  const primaryKey = getTablePrimaryKey(tableName)
  const payload = buildInsertPayload(tableName, fields, formValues)

  for (const col of generatedColumns[tableName] ?? []) {
    delete payload[col]
  }

  const { data, error } = await supabase
    .from(tableName)
    .update(payload)
    .eq(primaryKey, primaryKeyValue)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update ${tableName}: ${error.message}`)
  }

  return data
}

export async function deleteHospitalRecord(tableName, primaryKeyValue) {
  const supabase = getSupabaseClient()
  const primaryKey = getTablePrimaryKey(tableName)

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq(primaryKey, primaryKeyValue)

  if (error) {
    throw new Error(`Failed to delete ${tableName}: ${error.message}`)
  }
}
