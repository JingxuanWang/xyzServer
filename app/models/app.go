package models

import (
	"github.com/robfig/revel"
	"database/sql"
)

type ConstMaster struct {
	const_name string
	event_id int32
	const_value float64
}

func (cm ConstMaster) SelectAll() {

}

