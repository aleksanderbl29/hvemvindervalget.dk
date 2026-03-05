get_parties <- function() {
  con <- connect_to_db()

  parties <- aleksandeR::parties |>
    select(party_code, party_name, party_name_short, party_color) |>
    mutate(
      party_begin = case_when(
        # Date for the beginning of the party
        # "01-01-xxxx" is just the year
        party_code == "A" ~ "01-01-1871",
        party_code == "B" ~ "21-05-1905",
        party_code == "C" ~ "22-02-1916",
        party_code == "F" ~ "01-01-1959",
        party_code == "I" ~ "07-05-2007", # Ny alliance
        party_code == "M" ~ "01-01-2022",
        party_code == "O" ~ "06-10-1995",
        party_code == "V" ~ "01-01-1870",
        party_code == "Æ" ~ "23-06-2022",
        party_code == "Ø" ~ "01-01-1989",
        party_code == "Å" ~ "27-11-2013",
        party_code == "H" ~ "15-01-2025"
      ),
      party_begin = dmy(party_begin),
      l_r_scale = case_when(
        party_code == "A" ~ 4,
        party_code == "B" ~ 5,
        party_code == "C" ~ 8,
        party_code == "F" ~ 3,
        party_code == "I" ~ 10,
        party_code == "M" ~ 6,
        party_code == "O" ~ 11,
        party_code == "V" ~ 7,
        party_code == "Æ" ~ 9,
        party_code == "Ø" ~ 1,
        party_code == "Å" ~ 2,
        party_code == "H" ~ 12
      )
    )

  dbWriteTable(
    con,
    "parties",
    parties,
    overwrite = TRUE
  )

  dbDisconnect(con)
  parties
}
