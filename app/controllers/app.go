package controllers

import "github.com/robfig/revel"

type Xyz struct {
	*revel.Controller
}

func (c Xyz) Index() revel.Result {
	return c.Render()
}

func (c Xyz) Test() revel.Result {
	return c.Render()
}
