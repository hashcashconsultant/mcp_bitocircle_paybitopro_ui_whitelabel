'use client'

import React, { useMemo } from 'react'
import {
  Box,
  TextField,
  Autocomplete,
  SxProps,
  Theme
} from '@mui/material'
import { Controller, Control, FieldErrors, UseFormSetValue, UseFormWatch, FieldValues, Path, PathValue } from 'react-hook-form'
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city'
import {
  handleBlockedUnicodeKeyDown,
  handleBlockedUnicodePaste,
  sanitizeBlockedUnicode,
  validateNoBlockedUnicode
} from '../utils/unicodeValidation'

interface CountryStateCityFieldsProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  watch: UseFormWatch<TFieldValues>
  errors: FieldErrors<TFieldValues>
  countryName: Path<TFieldValues>
  stateName: Path<TFieldValues>
  cityName: Path<TFieldValues>
  countryLabel?: string
  stateLabel?: string
  cityLabel?: string
  disabled?: boolean
  required?: boolean
  textFieldStyles?: SxProps<Theme>
  formFieldStyles?: SxProps<Theme>
}

export const CountryStateCityFields = <TFieldValues extends FieldValues = FieldValues>({
  control,
  setValue,
  watch,
  errors,
  countryName,
  stateName,
  cityName,
  countryLabel = 'Country *',
  stateLabel = 'State *',
  cityLabel = 'City *',
  disabled = false,
  required = true,
  textFieldStyles,
  formFieldStyles = { flex: 1, minWidth: { xs: '100%', md: 0 } }
}: CountryStateCityFieldsProps<TFieldValues>) => {
  const allCountries = useMemo(() => Country.getAllCountries(), [])

  const selectedCountryVal = (watch(countryName) as string) || ''
  const selectedStateVal = (watch(stateName) as string) || ''

  // Locate the country object by name or isoCode
  const countryObj = useMemo(() => {
    if (!selectedCountryVal) return null
    const valLower = selectedCountryVal.trim().toLowerCase()
    return (
      allCountries.find(
        (c) =>
          c.name.toLowerCase() === valLower ||
          c.isoCode.toLowerCase() === valLower
      ) || null
    )
  }, [allCountries, selectedCountryVal])

  // Get states for the chosen country
  const states = useMemo(() => {
    if (!countryObj) return []
    return State.getStatesOfCountry(countryObj.isoCode)
  }, [countryObj])

  // Locate the state object by name or isoCode
  const stateObj = useMemo(() => {
    if (!countryObj || !selectedStateVal) return null
    const valLower = selectedStateVal.trim().toLowerCase()
    return (
      states.find(
        (s) =>
          s.name.toLowerCase() === valLower ||
          s.isoCode.toLowerCase() === valLower
      ) || null
    )
  }, [countryObj, states, selectedStateVal])

  // Get cities for the chosen country & state
  const cities = useMemo(() => {
    if (!countryObj || !stateObj) return []
    return City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode)
  }, [countryObj, stateObj])

  const hasStates = states.length > 0
  const hasCities = cities.length > 0

  const isStateDisabled = disabled || !selectedCountryVal
  const isCityDisabled = disabled || !selectedCountryVal || (hasStates && !selectedStateVal)

  return (
    <>
      {/* Country */}
      <Box sx={formFieldStyles}>
        <Controller
          name={countryName}
          control={control}
          rules={{
            required: required ? `${countryLabel.replace('*', '').trim()} is required` : false,
            validate: validateNoBlockedUnicode
          }}
          render={({ field: { onChange, value } }) => (
            <Autocomplete<ICountry, false, false, true>
              disabled={disabled}
              options={allCountries}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                return option.name || ''
              }}
              value={
                allCountries.find(
                  (c) =>
                    c.name.toLowerCase() === (value || '').trim().toLowerCase() ||
                    c.isoCode.toLowerCase() === (value || '').trim().toLowerCase()
                ) || (value ? ({ name: value } as unknown as ICountry) : null)
              }
              onChange={(_, newValue) => {
                const countryNameStr = typeof newValue === 'string' ? newValue : newValue?.name || ''
                const sanitized = sanitizeBlockedUnicode(countryNameStr)
                onChange(sanitized)
                // Reset child fields when country changes
                setValue(stateName, '' as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true, shouldDirty: true })
                setValue(cityName, '' as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true, shouldDirty: true })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={countryLabel}
                  placeholder="Search or select Country"
                  error={!!errors[countryName]}
                  helperText={errors[countryName]?.message as string}
                  sx={textFieldStyles}
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: handleBlockedUnicodeKeyDown,
                    onPaste: handleBlockedUnicodePaste,
                    autoComplete: 'new-password'
                  }}
                />
              )}
            />
          )}
        />
      </Box>

      {/* State */}
      <Box sx={formFieldStyles}>
        <Controller
          name={stateName}
          control={control}
          rules={{
            required: required ? `${stateLabel.replace('*', '').trim()} is required` : false,
            validate: validateNoBlockedUnicode
          }}
          render={({ field: { onChange, value } }) => (
            <Autocomplete<IState | string, false, false, boolean>
              freeSolo={!hasStates}
              disabled={isStateDisabled}
              options={states}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                return option.name || ''
              }}
              value={
                states.find(
                  (s) =>
                    s.name.toLowerCase() === (value || '').trim().toLowerCase() ||
                    s.isoCode.toLowerCase() === (value || '').trim().toLowerCase()
                ) || value || ''
              }
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input' && !hasStates) {
                  const sanitized = sanitizeBlockedUnicode(newInputValue)
                  onChange(sanitized)
                  setValue(cityName, '' as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true, shouldDirty: true })
                }
              }}
              onChange={(_, newValue) => {
                const stateNameStr = typeof newValue === 'string' ? newValue : (newValue as IState)?.name || ''
                const sanitized = sanitizeBlockedUnicode(stateNameStr)
                onChange(sanitized)
                // Reset city when state changes
                setValue(cityName, '' as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true, shouldDirty: true })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={stateLabel}
                  placeholder={
                    isStateDisabled
                      ? 'Select Country first'
                      : hasStates
                      ? 'Search or select State'
                      : 'Enter State'
                  }
                  error={!!errors[stateName]}
                  helperText={errors[stateName]?.message as string}
                  sx={textFieldStyles}
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: handleBlockedUnicodeKeyDown,
                    onPaste: handleBlockedUnicodePaste,
                    autoComplete: 'new-password'
                  }}
                />
              )}
            />
          )}
        />
      </Box>

      {/* City */}
      <Box sx={formFieldStyles}>
        <Controller
          name={cityName}
          control={control}
          rules={{
            required: required ? `${cityLabel.replace('*', '').trim()} is required` : false,
            validate: validateNoBlockedUnicode
          }}
          render={({ field: { onChange, value } }) => (
            <Autocomplete<ICity | string, false, false, boolean>
              freeSolo={!hasCities}
              disabled={isCityDisabled}
              options={cities}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                return option.name || ''
              }}
              value={
                cities.find(
                  (c) => c.name.toLowerCase() === (value || '').trim().toLowerCase()
                ) || value || ''
              }
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input' && !hasCities) {
                  const sanitized = sanitizeBlockedUnicode(newInputValue)
                  onChange(sanitized)
                }
              }}
              onChange={(_, newValue) => {
                const cityNameStr = typeof newValue === 'string' ? newValue : (newValue as ICity)?.name || ''
                const sanitized = sanitizeBlockedUnicode(cityNameStr)
                onChange(sanitized)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={cityLabel}
                  placeholder={
                    isCityDisabled
                      ? 'Select State first'
                      : hasCities
                      ? 'Search or select City'
                      : 'Enter City'
                  }
                  error={!!errors[cityName]}
                  helperText={errors[cityName]?.message as string}
                  sx={textFieldStyles}
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: handleBlockedUnicodeKeyDown,
                    onPaste: handleBlockedUnicodePaste,
                    autoComplete: 'new-password'
                  }}
                />
              )}
            />
          )}
        />
      </Box>
    </>
  )
}

export default CountryStateCityFields
